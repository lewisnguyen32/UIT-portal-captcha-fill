# Hướng dẫn tự động điền Captcha trên Student Portal UIT

Tài liệu này hướng dẫn cách cài đặt và sử dụng Userscript giúp tự động điền captcha mỗi khi đăng nhập vào hệ thống cổng thông tin sinh viên UIT ([student.uit.edu.vn](https://student.uit.edu.vn/)).

---

## 💡 Cơ chế hoạt động của Captcha UIT

Hiện tại, hệ thống Captcha trên trang cổng thông tin sinh viên UIT lưu trữ đáp án trực tiếp trong thuộc tính `alt` của thẻ ảnh `<img>` với định dạng `captcha:[đáp_án]` (Ví dụ: `<img ... alt="captcha:cpu">`).

Userscript này sẽ:
1. Tìm kiếm thẻ hình ảnh có thuộc tính `alt` bắt đầu bằng `captcha:`.
2. Trích xuất đáp án từ thuộc tính đó (ví dụ: `cpu`).
3. Tự động điền đáp án này vào ô nhập liệu captcha (`#edit-english-captcha-answer`).
4. Sử dụng `MutationObserver` để tự động điền lại nếu bạn click thay đổi mã captcha khác hoặc tải lại captcha động qua AJAX.

---

## 🛠️ Các bước cài đặt và sử dụng

### Bước 1: Cài đặt tiện ích mở rộng Tampermonkey
Nếu chưa cài đặt, bạn hãy thêm tiện ích Tampermonkey vào trình duyệt của mình:
- [Tải Tampermonkey cho Chrome / Edge / Brave / Opera / Cốc Cốc](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Tải Tampermonkey cho Firefox](https://addons.mozilla.org/vi/firefox/addon/tampermonkey/)

### Bước 2: Tạo Userscript mới
1. Click vào biểu tượng **Tampermonkey** ở góc trên bên phải trình duyệt.
2. Chọn **Dashboard** (Bảng điều khiển) -> bấm vào tab **Utilities** hoặc bấm biểu tượng dấu cộng `+` để thêm script mới.
3. Sao chép toàn bộ nội dung mã nguồn bên dưới:

```javascript
// ==UserScript==
// @name         UIT Auto Fill Captcha
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Tự động điền captcha cho student.uit.edu.vn từ thuộc tính alt của ảnh captcha
// @match        https://student.uit.edu.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function solveCaptcha() {
        const captchaImg = document.querySelector('img[alt^="captcha:"]');
        const captchaInput = document.getElementById('edit-english-captcha-answer');

        if (captchaImg && captchaInput) {
            const altText = captchaImg.getAttribute('alt') || '';
            const match = altText.match(/^captcha:(.+)$/);
            if (match) {
                const answer = match[1].trim();
                if (captchaInput.value !== answer) {
                    captchaInput.value = answer;
                    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('[UIT Captcha Solver] Đã tự động điền captcha:', answer);
                }
            }
        }
    }

    solveCaptcha();

    const observer = new MutationObserver((mutations) => {
        solveCaptcha();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['alt', 'src']
    });
})();
```

### Bước 3: Lưu script
1. Nhấn tổ hợp phím `Ctrl + S` (hoặc vào menu `File` -> chọn `Save`).
2. Trình duyệt sẽ lưu lại script này.

### Bước 4: Kiểm tra kết quả
- Truy cập vào trang [student.uit.edu.vn](https://student.uit.edu.vn/).
- Ô captcha sẽ tự động được điền từ giá trị của thuộc tính `alt` mà bạn không cần phải làm gì cả.

---

## 🔒 Cam kết an toàn
Mã nguồn chạy hoàn toàn offline trên trình duyệt của bạn (Local client-side execution), không lưu trữ thông tin, không gửi bất kỳ dữ liệu nào ra máy chủ bên ngoài.
