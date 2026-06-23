// ==UserScript==
// @name         UIT Auto Fill & Auto Login Captcha
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Tự động điền captcha và tự động đăng nhập cho student.uit.edu.vn (có nút bật/tắt & tính năng chống lặp vô hạn)
// @match        https://student.uit.edu.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const MAX_ATTEMPTS = 3; // Giới hạn số lần thử liên tiếp tối đa
    const ATTEMPTS_TIMEFRAME = 120000; // Khoảng thời gian reset đếm (2 phút)

    let hasSubmitted = false;
    let submitTimeout = null;

    // Kiểm tra xem có đang ở trang đăng nhập (có ô captcha) hay không
    const isLoginPage = !!document.getElementById('edit-english-captcha-answer');

    if (!isLoginPage) {
        // Nếu không phải trang đăng nhập (đã đăng nhập thành công hoặc ở trang khác), xóa bộ đếm lỗi
        sessionStorage.removeItem('uit_login_attempts');
        sessionStorage.removeItem('uit_last_login_attempt');
        return;
    }

    // Đọc trạng thái đếm lỗi
    let attempts = parseInt(sessionStorage.getItem('uit_login_attempts') || '0', 10);
    let lastAttempt = parseInt(sessionStorage.getItem('uit_last_login_attempt') || '0', 10);
    const now = Date.now();

    // Nếu khoảng cách giữa các lần thử quá lâu (ví dụ 2 phút), reset lại bộ đếm
    if (now - lastAttempt > ATTEMPTS_TIMEFRAME) {
        attempts = 0;
        sessionStorage.setItem('uit_login_attempts', '0');
    }

    // Tự động tắt (Safe Turn Off) nếu vượt quá số lần đăng nhập lỗi liên tiếp
    let isLoopDetected = false;
    if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem('uit_auto_login', 'false'); // Tắt tự động đăng nhập
        sessionStorage.setItem('uit_login_attempts', '0'); // Reset lại đếm lỗi sau khi đã tắt
        isLoopDetected = true;
        console.warn('[UIT Captcha Solver] Phát hiện nguy cơ lặp vô hạn! Đã tự động tắt tính năng Tự động đăng nhập.');
    }

    function setupCredentialListeners() {
        const usernameInput = document.querySelector('input[name="name"]') || document.getElementById('edit-name');
        const passwordInput = document.querySelector('input[name="pass"]') || document.getElementById('edit-pass');
        
        if (usernameInput && !usernameInput.dataset.listenerAdded) {
            usernameInput.addEventListener('input', solveCaptcha);
            usernameInput.addEventListener('change', solveCaptcha);
            usernameInput.dataset.listenerAdded = 'true';
        }
        if (passwordInput && !passwordInput.dataset.listenerAdded) {
            passwordInput.addEventListener('input', solveCaptcha);
            passwordInput.addEventListener('change', solveCaptcha);
            passwordInput.dataset.listenerAdded = 'true';
        }
    }

    function insertToggleCheckbox() {
        if (document.getElementById('auto-login-toggle-container')) return;

        const submitBtn = document.getElementById('edit-submit') || 
                          document.querySelector('input[type="submit"][value="Đăng nhập"]') ||
                          document.querySelector('input[type="submit"]');
        
        if (submitBtn) {
            const container = document.createElement('div');
            container.id = 'auto-login-toggle-container';
            container.style.cssText = 'margin: 10px 0; display: flex; flex-direction: column; gap: 4px; font-family: sans-serif;';

            // Dòng chứa checkbox và label
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: #333;';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'auto-login-toggle';
            checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px; margin: 0;';
            checkbox.checked = localStorage.getItem('uit_auto_login') !== 'false';

            checkbox.addEventListener('change', (e) => {
                localStorage.setItem('uit_auto_login', e.target.checked);
                console.log('[UIT Captcha Solver] Đã đổi trạng thái tự động đăng nhập:', e.target.checked);
                
                // Xóa cảnh báo nếu người dùng chủ động tích chọn lại
                const warning = document.getElementById('uit-loop-warning');
                if (warning) warning.remove();

                if (e.target.checked) {
                    solveCaptcha();
                }
            });

            const label = document.createElement('label');
            label.htmlFor = 'auto-login-toggle';
            label.textContent = 'Tự động đăng nhập';
            label.style.cssText = 'cursor: pointer; user-select: none; font-weight: 500; color: #444; margin: 0;';

            row.appendChild(checkbox);
            row.appendChild(label);
            container.appendChild(row);

            // Nếu phát hiện lặp, thêm cảnh báo màu đỏ trực quan
            if (isLoopDetected) {
                const warningMsg = document.createElement('div');
                warningMsg.id = 'uit-loop-warning';
                warningMsg.style.cssText = 'color: #d9534f; font-size: 12px; font-weight: bold; margin-top: 4px;';
                warningMsg.textContent = '⚠️ Đã tắt tự động đăng nhập do đăng nhập lỗi 3 lần liên tiếp.';
                container.appendChild(warningMsg);
            }

            submitBtn.parentNode.insertBefore(container, submitBtn);
        }
    }

    function solveCaptcha() {
        if (hasSubmitted) return;

        const captchaImg = document.querySelector('img[alt^="captcha:"]');
        const captchaInput = document.getElementById('edit-english-captcha-answer');

        if (captchaImg && captchaInput) {
            setupCredentialListeners();
            insertToggleCheckbox();

            const altText = captchaImg.getAttribute('alt') || '';
            const match = altText.match(/^captcha:(.+)$/);
            if (match) {
                const answer = match[1].trim();
                let captchaFilled = false;
                
                if (captchaInput.value !== answer) {
                    captchaInput.value = answer;
                    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('[UIT Captcha Solver] Đã tự động điền captcha:', answer);
                    captchaFilled = true;
                } else if (captchaInput.value === answer && answer !== '') {
                    captchaFilled = true;
                }

                const autoLoginEnabled = localStorage.getItem('uit_auto_login') !== 'false';
                if (autoLoginEnabled && captchaFilled) {
                    const usernameInput = document.querySelector('input[name="name"]') || document.getElementById('edit-name');
                    const passwordInput = document.querySelector('input[name="pass"]') || document.getElementById('edit-pass');
                    
                    const hasCredentials = usernameInput && usernameInput.value.trim() !== '' &&
                                           passwordInput && passwordInput.value.trim() !== '';

                    if (hasCredentials) {
                        if (submitTimeout) clearTimeout(submitTimeout);
                        submitTimeout = setTimeout(() => {
                            if (hasSubmitted) return;

                            const loginButton = document.getElementById('edit-submit') || 
                                                document.querySelector('input[type="submit"][value="Đăng nhập"]') ||
                                                document.querySelector('input[type="submit"]');
                            if (loginButton) {
                                // Tăng số lần thử đăng nhập và lưu thời gian thử
                                sessionStorage.setItem('uit_login_attempts', (attempts + 1).toString());
                                sessionStorage.setItem('uit_last_login_attempt', Date.now().toString());

                                console.log('[UIT Captcha Solver] Đang gửi yêu cầu đăng nhập (Lần thử ' + (attempts + 1) + ')...');
                                hasSubmitted = true;
                                loginButton.click();
                            }
                        }, 500);
                    }
                }
            }
        }
    }

    // Chạy giải captcha
    solveCaptcha();

    // Lắng nghe sự thay đổi của DOM (đề phòng captcha thay đổi động)
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
