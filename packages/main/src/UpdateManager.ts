import { autoUpdater, type UpdateInfo } from 'electron-updater';
import { app, BrowserWindow, dialog, shell } from 'electron';
import log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import {spawnSync} from 'child_process';
import * as https from 'https';

/**
 * UpdateManager - Quản lý cập nhật tự động cho ứng dụng Electron.
 *
 * TÍNH NĂNG:
 * - Tự động kiểm tra cập nhật khi khởi động (chỉ trong môi trường Production).
 * - Hiển thị hộp thoại thông báo có bản cập nhật mới kèm Release Notes.
 * - Cho phép người dùng chọn "Cập nhật" hoặc "Để sau".
 * - Hiển thị hộp thoại xác nhận khởi động lại sau khi tải xong.
 * - Ghi log chi tiết quá trình update vào file log của ứng dụng.
 *
 * HƯỚNG DẪN SỬ DỤNG (COPY SANG DỰ ÁN KHÁC):
 *
 * 1. Cài đặt Dependencies:
 *    Chạy lệnh: `pnpm add electron-updater electron-log` (hoặc npm/yarn tương ứng).
 *
 * 2. Copy file:
 *    Copy file `UpdateManager.ts` này vào thư mục source của Main Process.
 *
 * 3. Khởi tạo trong Main Process:
 *    Trong file entry point (thường là `index.ts` hoặc `main.ts`), import và gọi hàm init:
 *    ```ts
 *    import { UpdateManager } from './UpdateManager';
 *
 *    app.whenReady().then(() => {
 *      // ... các khởi tạo khác
 *      UpdateManager.init();
 *    });
 *    ```
 *
 * 4. Cấu hình `package.json`:
 *    Thêm thông tin repository (quan trọng để electron-builder nhận diện):
 *    ```json
 *    "repository": {
 *      "type": "git",
 *      "url": "git+https://github.com/username/repo-name.git"
 *    }
 *    ```
 *
 * 5. Cấu hình Electron Builder (ví dụ `.electron-builder.config.js`):
 *    Thêm cấu hình publish:
 *    ```js
 *    publish: {
 *      provider: 'github',
 *      owner: 'username',
 *      repo: 'repo-name'
 *    }
 *    ```
 *
 * 6. Biến môi trường (Environment Variables):
 *    Để publish release lên GitHub, cần có biến môi trường `GH_TOKEN` (GitHub Personal Access Token)
 *    khi chạy lệnh build/release.
 *    - Tạo token tại: https://github.com/settings/tokens/new
 *    - Quyền hạn (Scopes): `repo` (cho private repo) hoặc `public_repo` (cho public repo).
 *
 * 7. Quy trình Release (Dòng lệnh):
 *    Thêm script vào `package.json`:
 *    ```json
 *    "scripts": {
 *      "release": "cross-env MODE=production npm run build && electron-builder build --config .electron-builder.config.js --publish always"
 *    }
 *    ```
 *    Cách thực hiện release:
 *    B1: Tăng version trong `package.json` (ví dụ: 1.0.0 -> 1.0.1).
 *    B2: Chạy lệnh `npm run release` (hoặc `yarn release`, `pnpm release`).
 *    B3: Vào GitHub > Releases, edit bản Draft vừa tạo -> Publish.
 */
export class UpdateManager {
  private static instance: UpdateManager;
  private static devSigningMode: 'auto' | 'signed' | 'unsigned' = 'auto';
  private isManualCheck = false;
  private pendingReleaseNotes = '';
  private pendingVersion = '';
  private hasConfiguredFallbackFeed = false;
  private lastProgressPercent = -1;
  private progressWindow: BrowserWindow | null = null;
  private progressWindowReady = false;
  private pendingProgressPercent = 0;
  private canUseAutoUpdater = true;

  private constructor() {
    // Configure logging
    autoUpdater.logger = log;
    // (autoUpdater.logger as any).transports.file.level = 'info';

    // Disable auto download to ask user first
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    this.canUseAutoUpdater = this.resolveAutoUpdaterAvailability();

    // Force dev update config if in development
    if (import.meta.env.DEV) {
      autoUpdater.forceDevUpdateConfig = true;
    }

    this.initListeners();
  }

  public static init() {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    
    // Check for updates immediately on startup (only in production)
    if (import.meta.env.PROD) {
      UpdateManager.instance.checkForUpdates();
    }
  }

  public static checkForUpdatesManual() {
    if (UpdateManager.instance) {
      UpdateManager.instance.checkForUpdates(true);
    }
  }

  public static setDevSigningMode(mode: 'auto' | 'signed' | 'unsigned') {
    UpdateManager.devSigningMode = mode;
  }

  public static getDevSigningMode() {
    return UpdateManager.devSigningMode;
  }

  public static runDevDownloadProgressTest() {
    if (!UpdateManager.instance || import.meta.env.PROD) {
      return;
    }
    UpdateManager.instance.runProgressSimulation();
  }

  public static runDevSignedUpdateCheckTest() {
    if (!UpdateManager.instance || import.meta.env.PROD) {
      return;
    }
    UpdateManager.devSigningMode = 'signed';
    UpdateManager.instance.checkForUpdates(true);
  }

  public static runDevUnsignedUpdateCheckTest() {
    if (!UpdateManager.instance || import.meta.env.PROD) {
      return;
    }
    UpdateManager.devSigningMode = 'unsigned';
    UpdateManager.instance.checkForUpdates(true);
  }

  public static runDevMockUpdateAvailableAuto() {
    if (!UpdateManager.instance || import.meta.env.PROD) {
      return;
    }
    UpdateManager.instance.runMockUpdateAvailableAutoDialog();
  }

  public static runDevMockUpdateAvailableManual() {
    if (!UpdateManager.instance || import.meta.env.PROD) {
      return;
    }
    UpdateManager.instance.runMockUpdateAvailableManualDialog();
  }

  public checkForUpdates(isManual = false) {
    if (!this.canUseAutoUpdaterNow()) {
      if (isManual) {
        this.checkManualUpdateFallback();
      }
      return;
    }

    this.isManualCheck = isManual;
    this.pendingReleaseNotes = '';
    this.pendingVersion = '';
    log.info(`Checking for updates (Manual: ${isManual})...`);
    this.ensureUpdateFeedConfig();
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Error checking for updates:', err);
      if (this.tryFallbackFeedFromError(err)) {
        return;
      }
      if (this.isManualCheck) {
        dialog.showErrorBox('Lỗi kiểm tra cập nhật', 'Không thể kiểm tra cập nhật. Vui lòng thử lại sau.');
        this.isManualCheck = false;
      }
    });
  }

  private getAppUpdateYmlPath() {
    return path.join(process.resourcesPath, 'app-update.yml');
  }

  private ensureUpdateFeedConfig() {
    if (import.meta.env.DEV || this.hasConfiguredFallbackFeed) {
      return;
    }
    if (fs.existsSync(this.getAppUpdateYmlPath())) {
      return;
    }

    log.warn('app-update.yml is missing. Falling back to explicit GitHub feed config.');
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ntanvinh',
      repo: 'vi_lunar_calendar_releases',
    });
    this.hasConfiguredFallbackFeed = true;
  }

  private tryFallbackFeedFromError(error: unknown) {
    if (this.hasConfiguredFallbackFeed || import.meta.env.DEV) {
      return false;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('app-update.yml')) {
      return false;
    }

    this.ensureUpdateFeedConfig();
    autoUpdater.checkForUpdates().catch(retryError => {
      log.error('Retry checking for updates failed:', retryError);
      if (this.isManualCheck) {
        dialog.showErrorBox('Lỗi kiểm tra cập nhật', 'Không thể kiểm tra cập nhật. Vui lòng thử lại sau.');
        this.isManualCheck = false;
      }
    });
    return true;
  }

  private formatReleaseNotes(info: UpdateInfo) {
    if (!info.releaseNotes) {
      return '';
    }
    const rawNotes = typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : info.releaseNotes.map(note => note.note).join('\n');

    return this.htmlToPlainText(rawNotes);
  }

  private htmlToPlainText(html: string) {
    const listReplaced = html
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/ul>/gi, '\n');

    const stripped = listReplaced.replace(/<[^>]+>/g, '');
    const decoded = stripped
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return decoded
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n');
  }

  private getReleaseNotesDetail() {
    if (!this.pendingReleaseNotes) {
      return undefined;
    }
    return `Nội dung cập nhật\n\n${this.pendingReleaseNotes}`;
  }

  private compareVersions(left: string, right: string) {
    const normalize = (value: string) => value.replace(/^v/i, '').split('.').map(item => parseInt(item, 10) || 0);
    const a = normalize(left);
    const b = normalize(right);
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const ai = a[i] ?? 0;
      const bi = b[i] ?? 0;
      if (ai > bi) return 1;
      if (ai < bi) return -1;
    }
    return 0;
  }

  private getDevMockVersion() {
    const parts = app.getVersion().split('.').map(item => parseInt(item, 10) || 0);
    if (parts.length === 0) {
      return 'v1.0.0';
    }
    parts[parts.length - 1] += 1;
    return `v${parts.join('.')}`;
  }

  private runMockUpdateAvailableAutoDialog() {
    const mockVersion = this.getDevMockVersion();
    this.pendingVersion = mockVersion;
    this.pendingReleaseNotes = [
      '• Cải thiện trải nghiệm cập nhật trên macOS.',
      '• Sửa lỗi hiển thị release notes HTML.',
      '• Tối ưu hiệu năng và độ ổn định.',
    ].join('\n');

    dialog.showMessageBox({
      type: 'info',
      title: 'Dev Preview',
      message: `Mô phỏng có bản cập nhật mới ${mockVersion}`,
      detail: this.getReleaseNotesDetail(),
      buttons: ['Mô phỏng tải update', 'Đóng'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    }).then(({response}) => {
      if (response === 0) {
        this.runProgressSimulation();
      }
    });
  }

  private runMockUpdateAvailableManualDialog() {
    const mockVersion = this.getDevMockVersion();
    const mockReleaseUrl = 'https://github.com/ntanvinh/vi_lunar_calendar_releases/releases';
    const detail = [
      '• Cải thiện trải nghiệm cập nhật trên macOS.',
      '• Sửa lỗi hiển thị release notes HTML.',
      '• Tối ưu hiệu năng và độ ổn định.',
    ].join('\n');

    dialog.showMessageBox({
      type: 'info',
      title: 'Dev Preview',
      message: `Mô phỏng có phiên bản mới ${mockVersion}`,
      detail,
      buttons: ['Mở link tải', 'Đóng'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    }).then(({response}) => {
      if (response === 0) {
        shell.openExternal(mockReleaseUrl);
      }
    });
  }

  private resolveAutoUpdaterAvailability() {
    if (process.platform !== 'darwin') {
      return true;
    }
    if (!app.isPackaged) {
      return true;
    }

    try {
      const result = spawnSync('codesign', ['-dv', process.execPath], {encoding: 'utf-8'});
      if (result.status !== 0) {
        return false;
      }
      const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
      return combinedOutput.includes('Authority=');
    } catch (error) {
      log.warn('Code signing check failed, fallback to manual update flow.', error);
      return false;
    }
  }

  private async checkManualUpdateFallback() {
    try {
      const release = await this.fetchLatestReleaseInfo();

      const latestVersion = release.tag_name ?? '';
      const currentVersion = app.getVersion();
      if (!latestVersion || this.compareVersions(latestVersion, currentVersion) <= 0) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Cập nhật',
          message: 'Bạn đang sử dụng phiên bản mới nhất.',
          buttons: ['OK'],
          noLink: true,
        });
        return;
      }

      const detail = this.htmlToPlainText(release.body ?? '');
      dialog.showMessageBox({
        type: 'info',
        title: 'Có phiên bản mới',
        message: `Phiên bản mới ${latestVersion} đã sẵn sàng.`,
        detail: detail || 'Phiên bản hiện tại chưa hỗ trợ tự cập nhật trên máy này. Vui lòng tải và cài đặt thủ công.',
        buttons: ['Mở trang tải', 'Để sau'],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      }).then(({response: action}) => {
        if (action === 0 && release.html_url) {
          shell.openExternal(release.html_url);
        }
      });
    } catch (error) {
      log.error('Manual update fallback failed', error);
      dialog.showMessageBox({
        type: 'warning',
        title: 'Lỗi kiểm tra cập nhật',
        message: 'Không thể kiểm tra cập nhật tự động.',
        detail: 'Bạn có muốn mở trang release để kiểm tra và cập nhật thủ công không?',
        buttons: ['Mở trang release', 'Đóng'],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      }).then(({response}) => {
        if (response === 0) {
          shell.openExternal('https://github.com/ntanvinh/vi_lunar_calendar_releases/releases');
        }
      });
    }
  }

  private requestText(url: string, redirectCount = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json, application/atom+xml, text/html',
          'User-Agent': 'VLunar-Calendar-Updater',
        },
      }, res => {
        const statusCode = res.statusCode ?? 0;
        const location = res.headers.location;
        if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
          if (redirectCount >= 5) {
            reject(new Error('Too many redirects while requesting release info'));
            return;
          }
          const nextUrl = new URL(location, url).toString();
          resolve(this.requestText(nextUrl, redirectCount + 1));
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`Request failed: ${statusCode}`));
          return;
        }

        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          raw += chunk;
        });
        res.on('end', () => resolve(raw));
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy(new Error('Request timeout'));
      });
      req.end();
    });
  }

  private parseLatestReleaseFromAtom(atomXml: string) {
    const entryMatch = atomXml.match(/<entry>([\s\S]*?)<\/entry>/i);
    if (!entryMatch) {
      return null;
    }
    const entry = entryMatch[1];
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/i);
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

    const tagName = titleMatch?.[1]?.trim() ?? '';
    const htmlUrl = linkMatch?.[1]?.trim() ?? 'https://github.com/ntanvinh/vi_lunar_calendar_releases/releases';
    const body = contentMatch?.[1]?.trim() ?? '';
    if (!tagName) {
      return null;
    }

    return {
      tag_name: tagName,
      html_url: htmlUrl,
      body,
    };
  }

  private async fetchLatestReleaseInfo() {
    try {
      const response = await fetch('https://api.github.com/repos/ntanvinh/vi_lunar_calendar_releases/releases/latest', {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'VLunar-Calendar-Updater',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API failed: ${response.status}`);
      }

      return await response.json() as {
        tag_name?: string;
        html_url?: string;
        body?: string;
      };
    } catch (apiError) {
      log.warn('GitHub API latest release request failed, trying releases.atom', apiError);
      const atom = await this.requestText('https://github.com/ntanvinh/vi_lunar_calendar_releases/releases.atom');
      const parsed = this.parseLatestReleaseFromAtom(atom);
      if (!parsed) {
        throw new Error('Unable to parse latest release from atom feed');
      }
      return parsed;
    }
  }

  private updateDownloadProgress(percent: number) {
    const normalized = Math.max(0, Math.min(100, percent));
    const progressValue = normalized / 100;
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.setProgressBar(progressValue);
      }
    });
    app.setBadgeCount(Math.round(normalized));
    this.pendingProgressPercent = normalized;
    this.showOrUpdateProgressWindow(normalized);
  }

  private clearDownloadProgress() {
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.setProgressBar(-1);
      }
    });
    app.setBadgeCount(0);
    this.lastProgressPercent = -1;
    if (this.progressWindow && !this.progressWindow.isDestroyed()) {
      this.progressWindow.close();
    }
    this.progressWindow = null;
    this.progressWindowReady = false;
    this.pendingProgressPercent = 0;
  }

  private getProgressWindowHtml(percent: number) {
    const normalized = Math.max(0, Math.min(100, Math.round(percent)));
    return `
      <html>
        <body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:#1d1d1f;">
          <div style="font-size:15px;font-weight:600;margin-bottom:10px;">Đang tải bản cập nhật</div>
          <div style="font-size:13px;color:#6e6e73;margin-bottom:12px;">${normalized}%</div>
          <div style="width:100%;height:8px;background:#dedee2;border-radius:999px;overflow:hidden;">
            <div style="width:${normalized}%;height:100%;background:#0a84ff;"></div>
          </div>
        </body>
      </html>
    `;
  }

  private showOrUpdateProgressWindow(percent: number) {
    if (!this.progressWindow || this.progressWindow.isDestroyed()) {
      this.progressWindow = new BrowserWindow({
        width: 380,
        height: 140,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        alwaysOnTop: true,
        title: 'Đang tải bản cập nhật',
        webPreferences: {
          sandbox: false,
          contextIsolation: false,
          nodeIntegration: true,
        },
      });

      this.progressWindow.on('closed', () => {
        this.progressWindow = null;
        this.progressWindowReady = false;
      });

      const html = this.getProgressWindowHtml(percent);
      this.progressWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`).then(() => {
        this.progressWindowReady = true;
        this.progressWindow?.show();
        this.progressWindow?.focus();
      });
      return;
    }

    const normalized = Math.max(0, Math.min(100, Math.round(percent)));
    this.progressWindow.setTitle(`Đang tải bản cập nhật - ${normalized}%`);
    this.progressWindow.setProgressBar(normalized / 100);
    if (!this.progressWindowReady || this.progressWindow.webContents.isLoading()) {
      return;
    }
    const html = this.getProgressWindowHtml(normalized);
    this.progressWindow.webContents.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`).catch(error => {
      log.error('Failed to render progress window UI', error);
    });
  }

  private showUpdateAvailableDialog(version: string) {
    const detail = this.getReleaseNotesDetail();
    return dialog.showMessageBox({
      type: 'info',
      title: 'Bản cập nhật mới',
      message: `Đã có phiên bản ${version}`,
      detail,
      buttons: ['Tải và cài đặt', 'Để sau'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    }).then(({ response }) => {
      if (response === 0) {
        log.info('User accepted update. Downloading...');
        autoUpdater.downloadUpdate();
      } else {
        log.info('User declined update.');
      }
    });
  }

  private showManualDownloadStartedDialog(version: string) {
    const detail = this.getReleaseNotesDetail();
    return dialog.showMessageBox({
      type: 'info',
      title: 'Đang tải bản cập nhật',
      message: `Đang tải phiên bản ${version}`,
      detail,
      buttons: ['OK'],
      noLink: true,
    });
  }

  private showInstallDialog() {
    const detail = this.getReleaseNotesDetail();
    const versionLabel = this.pendingVersion ? ` ${this.pendingVersion}` : '';
    return dialog.showMessageBox({
      type: 'question',
      title: 'Sẵn sàng cài đặt',
      message: `Bản cập nhật${versionLabel} đã tải xong`,
      detail,
      buttons: ['Khởi động lại để cài đặt', 'Để sau'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    }).then(({ response }) => {
      if (response === 0) {
        log.info('Running quitAndInstall');
        autoUpdater.quitAndInstall(false, true);
      }
    });
  }

  private runProgressSimulation() {
    this.pendingReleaseNotes = 'Mô phỏng tiến trình tải bản cập nhật trong môi trường development.';
    this.pendingVersion = `v${app.getVersion()} (dev test)`;
    this.clearDownloadProgress();

    let percent = 0;
    const interval = setInterval(() => {
      percent += 5;
      this.updateDownloadProgress(percent);
      if (percent >= 100) {
        clearInterval(interval);
        this.clearDownloadProgress();
        dialog.showMessageBox({
          type: 'info',
          title: 'Dev Test',
          message: 'Mô phỏng tải cập nhật đã hoàn tất.',
          detail: this.getReleaseNotesDetail(),
          buttons: ['OK'],
          noLink: true,
        });
      }
    }, 150);
  }

  private canUseAutoUpdaterNow() {
    if (!import.meta.env.DEV) {
      return this.canUseAutoUpdater;
    }
    if (UpdateManager.devSigningMode === 'signed') {
      return true;
    }
    if (UpdateManager.devSigningMode === 'unsigned') {
      return false;
    }
    return this.canUseAutoUpdater;
  }

  private initListeners() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('Update available:', info);
      const releaseNotes = this.formatReleaseNotes(info);
      this.pendingReleaseNotes = releaseNotes;
      this.pendingVersion = info.version;

      if (this.isManualCheck) {
        this.isManualCheck = false;
        this.showManualDownloadStartedDialog(info.version);
        autoUpdater.downloadUpdate();
        return;
      }

      this.showUpdateAvailableDialog(info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available.', info);
      if (this.isManualCheck) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Cập nhật',
          message: 'Bạn đang sử dụng phiên bản mới nhất.',
          buttons: ['OK'],
        });
        this.isManualCheck = false;
      }
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      this.clearDownloadProgress();
      if (this.isManualCheck) {
        dialog.showErrorBox('Lỗi cập nhật', 'Đã xảy ra lỗi trong quá trình cập nhật: ' + (err.message || err));
        this.isManualCheck = false;
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const roundedPercent = Math.round(progressObj.percent);
      if (roundedPercent !== this.lastProgressPercent) {
        this.lastProgressPercent = roundedPercent;
        const logMessage = `Downloading update: ${roundedPercent}% (${progressObj.transferred}/${progressObj.total})`;
        log.info(logMessage);
        this.updateDownloadProgress(roundedPercent);
      }
    });

    autoUpdater.on('update-downloaded', (_info) => {
      log.info('Update downloaded');
      this.clearDownloadProgress();
      this.showInstallDialog();
    });
  }
}
