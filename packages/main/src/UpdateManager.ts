import { autoUpdater, type UpdateInfo } from 'electron-updater';
import { dialog } from 'electron';
import log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';

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
  private isManualCheck = false;
  private pendingReleaseNotes = '';
  private pendingVersion = '';
  private hasConfiguredFallbackFeed = false;

  private constructor() {
    // Configure logging
    autoUpdater.logger = log;
    // (autoUpdater.logger as any).transports.file.level = 'info';

    // Disable auto download to ask user first
    autoUpdater.autoDownload = false;

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

  public checkForUpdates(isManual = false) {
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
    if (typeof info.releaseNotes === 'string') {
      return info.releaseNotes;
    }
    return info.releaseNotes.map(note => note.note).join('\n');
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
        dialog.showMessageBox({
          type: 'info',
          title: 'Đang tải bản cập nhật',
          message: `Đang tải phiên bản ${info.version}. Ứng dụng sẽ hỏi cài đặt ngay sau khi tải xong.`,
          detail: releaseNotes ? `Nội dung cập nhật:\n${releaseNotes}` : undefined,
          buttons: ['OK'],
        });
        autoUpdater.downloadUpdate();
        return;
      }

      dialog.showMessageBox({
        type: 'info',
        title: 'Cập nhật mới',
        message: `Đã có phiên bản mới ${info.version}. Bạn có muốn tải về ngay không?`,
        detail: releaseNotes ? `Nội dung cập nhật:\n${releaseNotes}` : undefined,
        buttons: ['Cập nhật', 'Để sau'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) {
          log.info('User accepted update. Downloading...');
          autoUpdater.downloadUpdate();
        } else {
          log.info('User declined update.');
        }
      });
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
      if (this.isManualCheck) {
        dialog.showErrorBox('Lỗi cập nhật', 'Đã xảy ra lỗi trong quá trình cập nhật: ' + (err.message || err));
        this.isManualCheck = false;
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
      log.info(log_message);
      // Optional: Send progress to renderer if you want a progress bar UI
    });

    autoUpdater.on('update-downloaded', (_info) => {
      log.info('Update downloaded');
      const detail = this.pendingReleaseNotes ? `Nội dung cập nhật:\n${this.pendingReleaseNotes}` : undefined;
      const versionLabel = this.pendingVersion ? ` ${this.pendingVersion}` : '';

      dialog.showMessageBox({
        type: 'question',
        title: 'Cài đặt cập nhật',
        message: `Bản cập nhật${versionLabel} đã được tải về. Bạn có muốn khởi động lại để cài đặt ngay không?`,
        detail,
        buttons: ['Khởi động lại ngay', 'Để sau'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }
}
