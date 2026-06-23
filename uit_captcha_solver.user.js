// ==UserScript==
// @name         UIT Auto Fill Captcha
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Tự động điền captcha cho student.uit.edu.vn từ thuộc tính alt của ảnh captcha
// @author       Antigravity
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
                // Chỉ điền nếu giá trị hiện tại khác với đáp án để tránh vòng lặp vô hạn
                if (captchaInput.value !== answer) {
                    captchaInput.value = answer;
                    // Kích hoạt các sự kiện input và change để đảm bảo nếu trang web có code validate JS thì vẫn nhận
                    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('[UIT Captcha Solver] Đã tự động điền captcha:', answer);
                }
            }
        }
    }

    // Chạy ngay khi document-end
    solveCaptcha();

    // Lắng nghe sự thay đổi của DOM (đề phòng captcha được tải lại bằng AJAX/dynamic loading)
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
