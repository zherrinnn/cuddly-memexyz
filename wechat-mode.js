(function () {
    'use strict';

    var STORAGE_KEY = 'uwu-wechat-daylight-mode';
    var THEME_KEY = 'uwu-wechat-theme';
    var enabled = false;
    var theme = 'day';
    var originalThemeColor = null;
    var runtimeObserver = null;
    var typingObserver = null;
    var runtimeFrame = 0;
    var keyboardFrame = 0;
    var keyboardViewportBaseline = 0;
    var savedPresentationSettings = null;

    var RUNTIME_OVERRIDES = [
        {
            selector: '.header',
            properties: {
                'height': 'calc(38px + env(safe-area-inset-top, 0px))',
                'min-height': 'calc(38px + env(safe-area-inset-top, 0px))'
            }
        },
        {
            selector: '.header-inner, .header-right, .header-left, .header-actions',
            properties: {
                'height': '38px',
                'min-height': '38px'
            }
        },
        {
            selector: '.header-left',
            properties: {
                'display': 'grid',
                'place-items': 'center',
                'top': 'auto',
                'bottom': '0',
                'left': '-6px',
                'transform': 'none'
            }
        },
        {
            selector: '.header-actions',
            properties: {
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'flex-end',
                'top': 'auto',
                'bottom': '0',
                'transform': 'none'
            }
        },
        {
            selector: '.header-right > .user-info:first-child',
            properties: {
                'display': 'grid',
                'place-items': 'center',
                'top': 'auto',
                'bottom': '0',
                'height': '38px',
                'min-height': '38px'
            }
        },
        {
            selector: '#dc-mobile-open-btn',
            properties: {
                'display': 'grid',
                'place-items': 'center',
                'width': '38px',
                'min-width': '38px',
                'height': '38px',
                'min-height': '38px',
                'margin': '0',
                'align-self': 'center',
                'color': 'transparent',
                'border': '0',
                'background-color': 'transparent',
                'background-image': 'url("./assets/back-clean.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '22px 22px',
                'background-position': '50% calc(50% - 2.6px)',
                'box-shadow': 'none',
                'filter': 'none',
                '-webkit-backdrop-filter': 'none',
                'backdrop-filter': 'none',
                'transform': 'none'
            },
            nightProperties: {
                'background-image': 'url("./assets/night-back.svg")',
                'background-size': '12px 24px',
                'filter': 'none'
            }
        },
        {
            selector: '#dc-mobile-open-btn > *, #wechat-more-btn > *, #chat-plus-btn > *, #combo-btn > *',
            properties: {
                'display': 'none'
            }
        },
        {
            selector: '#partner-name, .partner-name-line #partner-name',
            properties: {
                'height': '28px',
                'min-height': '28px',
                'line-height': '28px',
                'margin': '0',
                'padding': '0',
                'overflow': 'visible',
                'clip-path': 'none'
            }
        },
        {
            selector: '.partner-name-line',
            properties: {
                'height': '38px',
                'min-height': '38px',
                'line-height': 'normal',
                'margin': '0',
                'padding': '0',
                'overflow': 'visible',
                'clip-path': 'none'
            }
        },
        {
            selector: '#partner-name',
            properties: {
                'align-self': 'center',
                'font-family': '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif',
                'font-weight': '400',
                'position': 'relative',
                'z-index': '12',
                'transform': 'translateY(0.5px)'
            }
        },
        {
            selector: '#wechat-more-btn',
            properties: {
                'display': 'grid',
                'place-items': 'center',
                'width': '38px',
                'min-width': '38px',
                'height': '38px',
                'min-height': '38px',
                'margin': '0',
                'align-self': 'center',
                'padding': '0',
                'border': '0',
                'background-color': 'transparent',
                'background-image': 'url("./assets/more-clean.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '21px 21px',
                'background-position': 'calc(50% + 0.5px) calc(50% - 2.14px)',
                'transform': 'none'
            },
            nightProperties: {
                'background-image': 'url("./assets/night-more.svg")',
                'background-size': '24px 24px',
                'filter': 'none'
            }
        },
        {
            selector: '#dc-main .message-avatar',
            properties: {
                'display': 'block',
                'visibility': 'visible',
                'opacity': '1',
                'width': '40px',
                'min-width': '40px',
                'max-width': '40px',
                'height': '40px',
                'min-height': '40px',
                'max-height': '40px',
                'flex': '0 0 40px',
                'margin': '0',
                'padding': '0'
            }
        },
        {
            selector: '.main-chat-area',
            properties: {
                'padding-top': 'calc(38px + env(safe-area-inset-top, 0px))',
                'padding-bottom': 'calc(56px + env(safe-area-inset-bottom, 0px))'
            }
        },
        {
            selector: '#dc-main .input-area-wrapper',
            properties: {
                'background': 'rgba(246, 246, 246, 0.96)',
                'background-color': 'rgba(246, 246, 246, 0.96)',
                'width': '100%',
                'max-width': 'none',
                'margin': '0',
                'transform': 'none',
                'display': 'grid',
                'grid-template-columns': '36px minmax(0, 1fr)',
                'column-gap': '4px',
                'height': 'calc(56px + env(safe-area-inset-bottom, 0px))',
                'min-height': 'calc(56px + env(safe-area-inset-bottom, 0px))',
                'padding': '7.667px 6px calc(8.333px + env(safe-area-inset-bottom, 0px)) 8px'
            },
            nightProperties: {
                'background': 'rgba(20, 20, 20, 0.96)',
                'background-color': 'rgba(20, 20, 20, 0.96)'
            }
        },
        {
            selector: '#dc-main .input-area',
            properties: {
                'display': 'flex',
                'align-items': 'center',
                'gap': '0',
                'height': '40px',
                'min-height': '40px',
                'max-height': '40px',
                'padding': '0'
            }
        },
        {
            selector: '#dc-main .message-input',
            properties: {
                'color': '#111111',
                'background': '#ffffff',
                'background-color': '#ffffff',
                'box-shadow': 'none',
                'filter': 'none',
                'backdrop-filter': 'none',
                'height': '40px',
                'min-height': '40px',
                'max-height': '40px',
                'margin': '0 7px 0 0'
            },
            nightProperties: {
                'color': '#d5d5d5',
                'background': '#292929',
                'background-color': '#292929'
            }
        },
        {
            selector: '#chat-plus-btn, #combo-btn, #wechat-continue-btn',
            properties: {
                'display': 'inline-flex',
                'width': '36px',
                'min-width': '36px',
                'max-width': '36px',
                'height': '40px',
                'min-height': '40px',
                'max-height': '40px',
                'align-self': 'center',
                'margin': '0',
                'padding': '0',
                'border': '0',
                'border-radius': '0',
                'background-color': 'transparent',
                'background-repeat': 'no-repeat',
                'transform': 'none'
            }
        },
        {
            selector: '#chat-plus-btn',
            properties: {
                'background-image': 'url("./assets/plus.svg")',
                'background-size': '29.5px 29.5px',
                'background-position': '50% calc(50% - 0.13px)',
                'transform': 'translateX(-1.5px)'
            },
            nightProperties: {
                'background-image': 'url("./assets/night-plus.svg")',
                'filter': 'none'
            }
        },
        {
            selector: '#combo-btn',
            properties: {
                'display': 'inline-flex',
                'visibility': 'visible',
                'opacity': '1',
                'background-image': 'url("./assets/sticker.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '72px 72px',
                'background-position': '-37.845px -17.665px'
            },
            nightProperties: {
                'background-image': 'url("./assets/night-sticker.svg")',
                'filter': 'none'
            }
        },
        {
            selector: '#wechat-continue-btn',
            properties: {
                'display': 'inline-flex',
                'margin-left': '4px',
                'background-image': 'url("./assets/send.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '29px 29px',
                'background-position': '50% calc(50% - 0.44px)'
            },
            nightProperties: {
                'background-image': 'url("./assets/night-send.svg")',
                'background-position': '50% calc(50% + 2.2px)',
                'filter': 'none'
            }
        },
        {
            selector: '.partner-status-arrow',
            properties: {
                'display': 'none',
                'visibility': 'hidden',
                'opacity': '0',
                'pointer-events': 'none'
            }
        },
        {
            selector: '#continue-btn, #send-btn',
            properties: {
                'display': 'none'
            }
        },
        {
            selector: '#dc-main .wx-clean-time-capsule, #dc-main .wx-clean-time-capsule span, #dc-main .meta-timestamp, #dc-main .discord-inline-timestamp, #dc-main .timestamp, #dc-main .msg-timestamp, #dc-main .inline-timestamp',
            properties: {
                'color': '#7f7f7f',
                'text-shadow': 'none'
            }
        },
        {
            /* The page creates the last received-message label with inline !important. */
            selector: '#dc-main .custom-independent-label, #dc-main .message-time, #dc-main .msg-time, #dc-main .time-label, #dc-main .read-receipt, #dc-main .discord-read-receipt, #dc-main .meta-read-receipt, #dc-main .message-meta, #dc-main .meta-timestamp, #dc-main .discord-inline-timestamp, #dc-main .inline-timestamp, #dc-main .timestamp, #dc-main .msg-timestamp',
            properties: {
                'display': 'none',
                'opacity': '0',
                'visibility': 'hidden'
            }
        },
        {
            selector: '#dc-main .typing-indicator-label, #dc-main .typing-indicator-settings-hint',
            properties: {
                'color': '#777777',
                'text-shadow': 'none'
            }
        }
    ];

    function wechatTimestampText(rawText) {
        var text = String(rawText || '').trim();
        var match = text.match(/^(.*?)(夜中|朝|昼|夕方|夜)\s+(\d{1,2}):(\d{2})$/);
        if (!match) return text;
        var prefix = match[1] || '';
        var hour = Number(match[3]);
        var label = '';
        if (match[2] === '夜中') label = '凌晨';
        else if (match[2] === '朝') label = '早上';
        else if (match[2] === '夕方') label = '傍晚';
        else if (match[2] === '夜') label = '晚上';
        else if (hour < 12) label = '上午';
        else if (hour < 14) label = '中午';
        else label = '下午';
        return prefix + label + ' ' + String(hour).padStart(2, '0') + ':' + match[4];
    }

    function syncTimestampLabels() {
        document.querySelectorAll('#dc-main .wx-clean-time-capsule span').forEach(function (element) {
            if (enabled) {
                if (!element.hasAttribute('data-wechat-original-text')) {
                    element.setAttribute('data-wechat-original-text', element.textContent || '');
                }
                var converted = wechatTimestampText(element.getAttribute('data-wechat-original-text'));
                if (element.textContent !== converted) element.textContent = converted;
            } else if (element.hasAttribute('data-wechat-original-text')) {
                var original = element.getAttribute('data-wechat-original-text');
                element.removeAttribute('data-wechat-original-text');
                if (element.textContent !== original) element.textContent = original;
            }
        });
    }

    function preferredMyName() {
        try {
            if (typeof settings !== 'undefined' && settings && settings.myName) {
                return String(settings.myName).trim() || '我';
            }
        } catch (error) {}
        var element = document.getElementById('my-name');
        return element ? (String(element.textContent || '').trim() || '我') : '我';
    }

    function syncReplySenderLabels() {
        var myName = preferredMyName();
        document.querySelectorAll('#dc-main .reply-inline-below .rib-sender').forEach(function (element) {
            var role = element.closest('.reply-inline-below') && element.closest('.reply-inline-below').getAttribute('data-reply-sender-role');
            var text = String(element.textContent || '').trim();
            if (role === 'user' || (!role && (text === '我：' || text === '我:'))) {
                element.textContent = myName + '：';
            }
        });
    }

    function syncKeyboardViewport() {
        if (keyboardFrame) window.cancelAnimationFrame(keyboardFrame);
        keyboardFrame = window.requestAnimationFrame(function () {
            keyboardFrame = 0;
            if (!document.body) return;
            var input = document.getElementById('message-input');
            var focused = !!input && document.activeElement === input;
            var viewport = window.visualViewport;
            var layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);

            if (!focused) keyboardViewportBaseline = layoutHeight;
            if (!keyboardViewportBaseline) keyboardViewportBaseline = layoutHeight;

            var visibleBottom = viewport ? Math.round(viewport.height + viewport.offsetTop) : layoutHeight;
            var keyboardOpen = !!(enabled && focused && viewport && keyboardViewportBaseline - visibleBottom > 80);
            document.body.classList.toggle('wechat-keyboard-open', keyboardOpen);
            if (keyboardOpen) {
                document.documentElement.style.setProperty('--wechat-visual-height', visibleBottom + 'px');
            } else {
                document.documentElement.style.removeProperty('--wechat-visual-height');
            }
        });
    }

    function preferredPartnerName() {
        try {
            if (typeof settings !== 'undefined' && settings && settings.partnerName) {
                return String(settings.partnerName).trim();
            }
        } catch (error) {}
        var element = document.getElementById('partner-name');
        if (!element) return '对方';
        var current = String(element.textContent || '').trim();
        if (/正在输入···$/.test(current) && element.hasAttribute('data-wechat-base-name')) {
            return element.getAttribute('data-wechat-base-name') || '对方';
        }
        current = current.replace(/正在输入···$/, '');
        return current || element.getAttribute('data-wechat-base-name') || '对方';
    }

    function syncTypingHeader() {
        var nameElement = document.getElementById('partner-name');
        var wrapper = document.getElementById('typing-indicator-wrapper');
        if (!nameElement) return;

        if (!nameElement.hasAttribute('data-wechat-base-name')) {
            nameElement.setAttribute('data-wechat-base-name', preferredPartnerName());
        }

        var inlineDisplay = wrapper ? wrapper.style.display : '';
        var isTyping = enabled && wrapper && (inlineDisplay === 'block' || inlineDisplay === 'flex');
        var baseName = preferredPartnerName() || nameElement.getAttribute('data-wechat-base-name') || '对方';

        if (isTyping) {
            nameElement.classList.add('wechat-partner-typing');
            nameElement.textContent = '对方正在输入···';
        } else {
            nameElement.classList.remove('wechat-partner-typing');
            if (!enabled) {
                baseName = nameElement.getAttribute('data-wechat-base-name') || baseName;
                nameElement.removeAttribute('data-wechat-base-name');
            } else {
                nameElement.setAttribute('data-wechat-base-name', baseName);
            }
            if (String(nameElement.textContent || '').trim() !== baseName) nameElement.textContent = baseName;
        }
    }

    function applyRuntimeOverrides() {
        if (!document.body) return;
        if (enabled) syncWechatPresentationSettings(true);
        syncCustomCssIsolation(enabled);
        var comboButton = document.getElementById('combo-btn');
        if (enabled && comboButton) comboButton.classList.remove('input-typing-hidden');
        RUNTIME_OVERRIDES.forEach(function (entry) {
            document.querySelectorAll(entry.selector).forEach(function (element) {
                if (enabled) {
                    if (!element.hasAttribute('data-wechat-original-style')) {
                        element.setAttribute('data-wechat-original-style', element.getAttribute('style') || '__none__');
                    }
                    var properties = Object.assign({}, entry.properties, theme === 'night' ? (entry.nightProperties || {}) : {});
                    Object.keys(properties).forEach(function (property) {
                        var value = properties[property];
                        if (element.style.getPropertyValue(property) !== value || element.style.getPropertyPriority(property) !== 'important') {
                            element.style.setProperty(property, value, 'important');
                        }
                    });
                } else if (element.hasAttribute('data-wechat-original-style')) {
                    var original = element.getAttribute('data-wechat-original-style');
                    element.removeAttribute('data-wechat-original-style');
                    if (original === '__none__') element.removeAttribute('style');
                    else element.setAttribute('style', original);
                }
            });
        });
        syncTimestampLabels();
        syncReplySenderLabels();
        syncTypingHeader();
        syncKeyboardViewport();
        updateSettingsCard();
    }

    function scheduleRuntimeOverrides() {
        if (!enabled || runtimeFrame) return;
        runtimeFrame = window.requestAnimationFrame(function () {
            runtimeFrame = 0;
            applyRuntimeOverrides();
        });
    }

    function readStoredMode() {
        try {
            var storedTheme = localStorage.getItem(THEME_KEY);
            if (storedTheme === 'day' || storedTheme === 'night') return storedTheme;
            return localStorage.getItem(STORAGE_KEY) === 'true' ? 'day' : 'off';
        } catch (error) {
            return 'off';
        }
    }

    function storeMode(value) {
        try {
            localStorage.setItem(THEME_KEY, value);
            localStorage.setItem(STORAGE_KEY, value === 'off' ? 'false' : 'true');
        } catch (error) {
            /* file:// privacy modes can reject storage; the active session still works. */
        }
    }

    function updateSettingsCard() {
        var card = document.getElementById('wechat-mode-settings-card');
        var status = document.getElementById('wechat-mode-card-status');
        if (card) card.setAttribute('aria-checked', enabled ? 'true' : 'false');
        if (card) card.setAttribute('data-active-theme', enabled ? theme : 'off');
        document.querySelectorAll('#wechat-mode-settings-card .wechat-theme-option').forEach(function (button) {
            var active = button.getAttribute('data-theme-value') === (enabled ? theme : 'off');
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        if (card && status) {
            status.textContent = enabled
                ? (theme === 'night' ? '已开启 · 微信夜间布局与配色' : '已开启 · 微信日间布局与配色')
                : '已关闭 · 选择日间或夜间开启';
        }

    }

    function syncThemeColor() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        if (originalThemeColor === null) {
            originalThemeColor = meta.getAttribute('content') || '#000000';
        }
        meta.setAttribute('content', enabled ? (theme === 'night' ? '#0f0f0f' : '#ededed') : originalThemeColor);
    }

    function syncCustomCssIsolation(value) {
        ['user-custom-bubble-style', 'user-custom-global-theme-style'].forEach(function (id) {
            var style = document.getElementById(id);
            if (!style) return;

            if (value) {
                if (!style.hasAttribute('data-wechat-original-media')) {
                    style.setAttribute('data-wechat-original-media', style.getAttribute('media') || '__none__');
                    style.setAttribute('data-wechat-original-disabled', style.disabled ? 'true' : 'false');
                }
                style.media = 'not all';
                style.disabled = true;
                style.setAttribute('data-wechat-css-suppressed', 'true');
                return;
            }

            if (!style.hasAttribute('data-wechat-css-suppressed')) return;
            var originalMedia = style.getAttribute('data-wechat-original-media');
            var originalDisabled = style.getAttribute('data-wechat-original-disabled') === 'true';
            if (originalMedia === '__none__') style.removeAttribute('media');
            else style.setAttribute('media', originalMedia || '');
            style.disabled = originalDisabled;
            style.removeAttribute('data-wechat-original-media');
            style.removeAttribute('data-wechat-original-disabled');
            style.removeAttribute('data-wechat-css-suppressed');
        });
    }

    function syncWechatPresentationSettings(value) {
        try {
            if (!document.body) return false;

            if (value) {
                if (!savedPresentationSettings) {
                    savedPresentationSettings = {
                        alwaysShowAvatar: document.body.classList.contains('always-show-avatar'),
                        hideReceivedAvatar: document.body.classList.contains('hide-received-avatar'),
                        hideSentAvatar: document.body.classList.contains('hide-sent-avatar')
                    };
                }
                document.body.classList.add('always-show-avatar');
                document.body.classList.remove('hide-received-avatar', 'hide-sent-avatar');
                return true;
            }

            if (savedPresentationSettings) {
                document.body.classList.toggle('always-show-avatar', !!savedPresentationSettings.alwaysShowAvatar);
                document.body.classList.toggle('hide-received-avatar', !!savedPresentationSettings.hideReceivedAvatar);
                document.body.classList.toggle('hide-sent-avatar', !!savedPresentationSettings.hideSentAvatar);
                savedPresentationSettings = null;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    function rerenderConversation() {
        try {
            if (typeof SESSION_ID !== 'undefined' && !SESSION_ID) return;
            if (typeof renderMessages === 'function') renderMessages(true);
        } catch (error) {}
    }

    function normalizeMode(value) {
        if (value === 'night') return 'night';
        if (value === 'day' || value === true) return 'day';
        return 'off';
    }

    function applyMode(value, options) {
        options = options || {};
        var nextTheme = normalizeMode(value);
        var nextEnabled = nextTheme !== 'off';
        var changed = enabled !== nextEnabled || (nextEnabled && theme !== nextTheme);
        enabled = nextEnabled;
        if (nextEnabled) theme = nextTheme;
        document.documentElement.setAttribute('data-wechat-mode', enabled ? 'true' : 'false');
        document.documentElement.setAttribute('data-wechat-theme', enabled ? theme : 'off');
        if (document.body) {
            document.body.classList.toggle('wechat-mode', enabled);
            document.body.classList.toggle('wechat-night-mode', enabled && theme === 'night');
        }
        syncWechatPresentationSettings(enabled);
        syncCustomCssIsolation(enabled);
        if (changed || options.forceRender) rerenderConversation();
        applyRuntimeOverrides();
        syncThemeColor();
        updateSettingsCard();
        if (options.persist !== false) storeMode(enabled ? theme : 'off');

        if (options.announce && typeof window.showNotification === 'function') {
            window.showNotification(enabled ? (theme === 'night' ? '微信夜间模式已开启' : '微信日间模式已开启') : '微信模式已关闭', 'success');
        }
    }

    function toggleMode() {
        applyMode(!enabled ? 'day' : (theme === 'day' ? 'night' : 'off'), { persist: true, announce: true });
    }

    function createSettingsCard() {
        var grid = document.querySelector('#settings-modal .settings-grid');
        if (!grid) return;

        if (document.getElementById('wechat-mode-settings-card')) return;

        var card = document.createElement('div');
        card.id = 'wechat-mode-settings-card';
        card.className = 'settings-card';
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', '微信模式');
        card.innerHTML =
            '<span class="wechat-mode-card-icon"><i class="fab fa-weixin" aria-hidden="true"></i></span>' +
            '<span class="wechat-mode-card-copy"><strong>微信模式</strong>' +
            '<small id="wechat-mode-card-status"></small></span>' +
            '<span class="wechat-theme-options" aria-label="微信模式外观">' +
            '<button type="button" class="wechat-theme-option" data-theme-value="off">关闭</button>' +
            '<button type="button" class="wechat-theme-option" data-theme-value="day">日间</button>' +
            '<button type="button" class="wechat-theme-option" data-theme-value="night">夜间</button>' +
            '</span>';

        card.querySelectorAll('.wechat-theme-option').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                applyMode(button.getAttribute('data-theme-value'), { persist: true, announce: true });
            });
        });

        grid.insertBefore(card, grid.firstChild);
        updateSettingsCard();
    }

    function createHeaderMoreButton() {
        if (document.getElementById('wechat-more-btn')) return;
        var actions = document.querySelector('.header-actions');
        if (!actions) return;

        var button = document.createElement('button');
        button.id = 'wechat-more-btn';
        button.type = 'button';
        button.title = '更多';
        button.setAttribute('aria-label', '打开设置');
        button.addEventListener('click', function () {
            var modal = document.getElementById('settings-modal');
            if (modal) {
                if (typeof window.showModal === 'function') {
                    window.showModal(modal);
                } else {
                    modal.style.display = 'flex';
                    window.requestAnimationFrame(function () {
                        var content = modal.querySelector('.modal-content');
                        if (content) {
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0) scale(1)';
                        }
                    });
                }
                return;
            }
            var original = document.getElementById('settings-btn');
            if (original) original.click();
        });
        actions.appendChild(button);
    }

    function createWechatContinueButton() {
        if (document.getElementById('wechat-continue-btn')) return;
        var original = document.getElementById('continue-btn');
        if (!original || !original.parentNode) return;

        var button = document.createElement('button');
        button.id = 'wechat-continue-btn';
        button.type = 'button';
        button.className = 'input-btn';
        button.title = '让对方继续说';
        button.setAttribute('aria-label', '让对方继续说');
        button.addEventListener('click', function () {
            original.click();
        });
        original.parentNode.insertBefore(button, original.nextSibling);
    }

    function bindTypingHeader() {
        var wrapper = document.getElementById('typing-indicator-wrapper');
        if (!wrapper) return;
        if (typingObserver) typingObserver.disconnect();
        typingObserver = new MutationObserver(syncTypingHeader);
        typingObserver.observe(wrapper, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: true,
            subtree: true
        });
        syncTypingHeader();
    }

    function initialize() {
        var meta = document.querySelector('meta[name="theme-color"]');
        originalThemeColor = meta ? (meta.getAttribute('content') || '#000000') : '#000000';
        createSettingsCard();
        createHeaderMoreButton();
        createWechatContinueButton();
        bindTypingHeader();
        keyboardViewportBaseline = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
        document.addEventListener('focusin', function (event) {
            if (event.target && event.target.id === 'message-input') {
                window.setTimeout(syncKeyboardViewport, 0);
                window.setTimeout(syncKeyboardViewport, 120);
            }
        });
        document.addEventListener('focusout', function (event) {
            if (event.target && event.target.id === 'message-input') {
                window.setTimeout(syncKeyboardViewport, 120);
            }
        });
        window.addEventListener('resize', syncKeyboardViewport, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncKeyboardViewport, { passive: true });
            window.visualViewport.addEventListener('scroll', syncKeyboardViewport, { passive: true });
        }
        applyMode(readStoredMode(), { persist: false, announce: false });

        if (!runtimeObserver && document.body) {
            runtimeObserver = new MutationObserver(function (mutations) {
                if (!enabled) return;
                var needsRefresh = mutations.some(function (mutation) {
                    if (mutation.type === 'childList') return true;
                    if (mutation.type === 'attributes' && mutation.target === document.documentElement && mutation.attributeName === 'style') return true;
                    if (mutation.type === 'attributes' && mutation.target === document.body && mutation.attributeName === 'class') return true;
                    return mutation.type === 'attributes' && mutation.attributeName === 'style' &&
                        mutation.target && mutation.target.matches &&
                        mutation.target.matches('.header, .header-inner, .header-right, .header-left, .header-actions, .header-right > .user-info:first-child, #dc-mobile-open-btn, #partner-name, .partner-name-line, .main-chat-area, .input-area-wrapper, .input-area, .message-input, #chat-plus-btn, #combo-btn, #wechat-continue-btn, .wx-clean-time-capsule, .wx-clean-time-capsule span, .custom-independent-label, .message-time, .msg-time, .time-label, .message-meta, .meta-timestamp, .discord-inline-timestamp, .timestamp, .msg-timestamp, .inline-timestamp, .read-receipt, .discord-read-receipt, .meta-read-receipt, .typing-indicator-label, .typing-indicator-settings-hint');
                });
                if (needsRefresh) scheduleRuntimeOverrides();
            });
            runtimeObserver.observe(document.getElementById('dc-main') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
            runtimeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            runtimeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
            if (document.head) runtimeObserver.observe(document.head, { subtree: true, childList: true });
        }

        /* The original page rebuilds a few panels after load; reattach only if needed. */
        [400, 1200, 2600].forEach(function (delay) {
            window.setTimeout(function () {
                createSettingsCard();
                createHeaderMoreButton();
                createWechatContinueButton();
                syncWechatPresentationSettings(enabled);
                updateSettingsCard();
                syncThemeColor();
                applyRuntimeOverrides();
            }, delay);
        });
    }

    window.setWechatMode = function (value) {
        applyMode(value, { persist: true, announce: false });
    };
    window.setWechatTheme = function (value) {
        applyMode(value, { persist: true, announce: false });
    };
    window.toggleWechatMode = toggleMode;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
