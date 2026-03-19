# Release Guide

## 1) Mục tiêu

- Phát hành bản mới cho macOS, Windows, Linux.
- Người dùng bấm `Kiểm tra cập nhật` trong menu sẽ tự tải bản mới và cài đặt.
- Hiển thị release notes khi có bản cập nhật.

## 2) Trạng thái hiện tại trong code

- Menu đã gọi check update ở [AppTray.ts](file:///Users/vinh/Documents/Developments/MyProjects/vi_lunar_calendar/packages/main/src/AppTray.ts#L146-L149).
- Auto update được xử lý ở [UpdateManager.ts](file:///Users/vinh/Documents/Developments/MyProjects/vi_lunar_calendar/packages/main/src/UpdateManager.ts).
- Publish provider đang dùng GitHub ở [.electron-builder.config.js](file:///Users/vinh/Documents/Developments/MyProjects/vi_lunar_calendar/.electron-builder.config.js#L68-L72) và [dev-app-update.yml](file:///Users/vinh/Documents/Developments/MyProjects/vi_lunar_calendar/dev-app-update.yml).
- Repo release/update hiện tại: `https://github.com/ntanvinh/vi_lunar_calendar_releases`.

## 3) Lệnh release theo máy đang dùng

- Dùng lệnh chung theo host OS/arch:

```bash
pnpm run release
```

- Sau khi upload artifact xong, script sẽ yêu cầu dev nhập release notes trong terminal.
- Kết thúc nhập bằng dòng `:end`.
- Script sẽ tự chuyển release từ Draft sang Published.

- Script này tự chọn target đúng với máy hiện tại:
  - macOS ARM -> `--mac --arm64`
  - macOS Intel -> `--mac --x64`
  - Windows -> `--win --x64` (hoặc `--arm64` nếu chạy trên ARM)
  - Linux -> `--linux`

- Các lệnh release cố định nếu muốn gọi thủ công:

```bash
pnpm run release:mac:arm64
pnpm run release:mac:x64
pnpm run release:win:x64
pnpm run release:linux:x64
```

## 4) Release đa OS đúng cách

- Không nên build đủ mọi OS từ một máy local.
- Khuyến nghị:
  - Build macOS trên macOS runner.
  - Build Windows trên Windows runner.
  - Build Linux trên Linux runner.
- Có thể dùng GitHub Actions matrix 3 OS để publish cùng tag version.

## 5) Quy trình phát hành đề xuất

1. Tăng version trong `package.json`.
2. Commit + push.
3. Tạo release/tag trên GitHub.
4. Chạy release trên đúng OS (hoặc CI matrix).
5. Publish GitHub Release (không để Draft).
6. Điền nội dung release notes ở phần body của release.

## 6) Release notes hiển thị trong app

- `UpdateManager` đọc `releaseNotes` từ metadata của update.
- Khi bấm `Kiểm tra cập nhật`:
  - Nếu có bản mới, app tự tải ngay.
  - Dialog thông báo có hiển thị nội dung release notes.
  - Tải xong sẽ hỏi khởi động lại để cài đặt, kèm release notes.

## 7) Giải thích lỗi DMG trên máy M1

Log lỗi mẫu:

```text
Exit code: 6. Command failed: hdiutil resize ... 1.dmg
```

Ý nghĩa thực tế:

- Không hẳn là fail vì không build được `mac x64` zip.
- Quy trình đã build nhiều target cùng lúc, và fail ở bước resize DMG.
- Cách an toàn hơn là build đúng kiến trúc host (đã cập nhật script `release` để làm việc này).

## 8) Điều kiện bắt buộc để update hoạt động

- GitHub token hợp lệ (`GH_TOKEN`) khi publish.
- Dùng `.env` ở root project và thêm:

```bash
GH_TOKEN=your_github_token
```

- Script release đã tự nạp `.env` qua `dotenv-cli`.
- GitHub Release public hoặc có quyền truy cập phù hợp.
- `latest*.yml` là bắt buộc cho auto-update.
- `.blockmap` nên giữ để hỗ trợ differential update (tải nhanh hơn ở các lần cập nhật nhỏ).
- Người dùng chạy bản cài từ build production (không phải dev mode).
