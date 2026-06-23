// ==UserScript==
// @name         UIT Auto Fill & Auto Login Captcha
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Tự động điền captcha và tự động đăng nhập cho student.uit.edu.vn (có nút bật/tắt)
// @match        https://student.uit.edu.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let hasSubmitted = false;
    let submitTimeout = null;

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
            container.style.cssText = 'margin: 10px 0; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #333; font-family: sans-serif;';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'auto-login-toggle';
            checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px; margin: 0;';
            checkbox.checked = localStorage.getItem('uit_auto_login') !== 'false';

            checkbox.addEventListener('change', (e) => {
                localStorage.setItem('uit_auto_login', e.target.checked);
                console.log('[UIT Captcha Solver] Đã đổi trạng thái tự động đăng nhập:', e.target.checked);
                if (e.target.checked) {
                    solveCaptcha();
                }
            });

            const label = document.createElement('label');
            label.htmlFor = 'auto-login-toggle';
            label.textContent = 'Tự động đăng nhập';
            label.style.cssText = 'cursor: pointer; user-select: none; font-weight: 500; font-family: sans-serif; color: #444;';

            container.appendChild(checkbox);
            container.appendChild(label);

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
                                console.log('[UIT Captcha Solver] Đã đầy đủ thông tin, tự động nhấn Đăng nhập...');
                                hasSubmitted = true;
                                loginButton.click();
                            }
                        }, 500);
                    }
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
