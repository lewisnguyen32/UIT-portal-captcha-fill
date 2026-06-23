# Hướng dẫn cài đặt script tự động điền Captcha UIT

Script này giúp tự động điền câu trả lời captcha trên trang web [student.uit.edu.vn](https://student.uit.edu.vn/) bằng cách trích xuất nội dung từ thuộc tính `alt` của hình ảnh captcha (ví dụ: `alt="captcha:cpu"` -> điền `cpu`).

---

## 🛠️ Hướng dẫn cài đặt qua Tampermonkey

### Bước 1: Cài đặt Extension Tampermonkey
Nếu bạn chưa cài đặt Tampermonkey, hãy cài đặt nó trên trình duyệt của bạn:
- [Tampermonkey cho Chrome / Edge / Brave / Opera](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Tampermonkey cho Firefox](https://addons.mozilla.org/vi/firefox/addon/tampermonkey/)

### Bước 2: Thêm script mới vào Tampermonkey
1. Click vào biểu tượng **Tampermonkey** trên thanh công cụ của trình duyệt.
2. Chọn **Dashboard** (Bảng điều khiển) hoặc **Create a new script...** (Tạo script mới).
3. Copy toàn bộ nội dung của file [uit_captcha_solver.user.js](file:///d:/Projects/UIT%20capcha%20extension/uit_captcha_solver.user.js).
4. Dán đè vào khung soạn thảo mã nguồn trong Tampermonkey.
5. Nhấn tổ hợp phím `Ctrl + S` (hoặc vào menu `File` -> `Save` trong Tampermonkey) để lưu lại.

---

## 🚀 Cách hoạt động
1. Khi bạn truy cập trang web [student.uit.edu.vn](https://student.uit.edu.vn/), script sẽ tự động tìm kiếm thẻ ảnh hiển thị captcha có chứa thuộc tính `alt` bắt đầu bằng `captcha:`.
2. Trích xuất phần text câu trả lời (ví dụ: `cpu`).
3. Tự động điền giá trị này vào ô nhập liệu captcha (`#edit-english-captcha-answer`).
4. Script sử dụng `MutationObserver` để tự động điền lại nếu captcha thay đổi hoặc được tải lại động (nhấn nút đổi mã captcha khác) mà không cần tải lại toàn bộ trang web.

---

## 📝 Mã nguồn chi tiết
Mã nguồn nằm ở file [uit_captcha_solver.user.js](file:///d:/Projects/UIT%20capcha%20extension/uit_captcha_solver.user.js).
