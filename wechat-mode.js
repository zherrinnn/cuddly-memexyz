(function () {
    'use strict';

    var STORAGE_KEY = 'uwu-wechat-daylight-mode';
    var enabled = false;
    var originalThemeColor = null;
    var runtimeObserver = null;
    var typingObserver = null;
    var runtimeFrame = 0;

    var RUNTIME_OVERRIDES = [
        {
            selector: '.header',
            properties: {
                'height': 'calc(47px + env(safe-area-inset-top, 0px))',
                'min-height': 'calc(47px + env(safe-area-inset-top, 0px))'
            }
        },
        {
            selector: '.header-inner, .header-right, .header-left, .header-actions',
            properties: {
                'height': '47px',
                'min-height': '47px'
            }
        },
        {
            selector: '.header-left',
            properties: {
                'display': 'grid',
                'place-items': 'center',
                'top': 'auto',
                'bottom': '0',
                'left': '-8px',
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
                'height': '47px',
                'min-height': '47px'
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
                'background-image': 'url("./assets/back.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '22px 22px',
                'background-position': '50% calc(50% - 0.1px)',
                'transform': 'none'
            }
        },
        {
            selector: '#dc-mobile-open-btn > *, #wechat-more-btn > *, #chat-plus-btn > *, #combo-btn > *',
            properties: {
                'display': 'none'
            }
        },
        {
            selector: '#partner-name, .partner-name-line, .partner-name-line #partner-name',
            properties: {
                'height': '20px',
                'min-height': '20px',
                'line-height': '20px',
                'margin': '0',
                'padding': '0'
            }
        },
        {
            selector: '#partner-name',
            properties: {
                'align-self': 'center',
                'font-family': '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif',
                'transform': 'none'
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
                'background-image': 'url("./assets/more.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '25px 25px',
                'background-position': '50% calc(50% + 0.36px)',
                'transform': 'none'
            }
        },
        {
            selector: '.main-chat-area',
            properties: {
                'padding-top': 'calc(47px + env(safe-area-inset-top, 0px))',
                'padding-bottom': 'calc(56px + env(safe-area-inset-bottom, 0px))'
            }
        },
        {
            selector: '#dc-main .input-area-wrapper',
            properties: {
                'background': 'rgba(247, 247, 247, 0.96)',
                'background-color': 'rgba(247, 247, 247, 0.96)',
                'width': '100%',
                'max-width': 'none',
                'margin': '0',
                'transform': 'none',
                'display': 'grid',
                'grid-template-columns': '36px minmax(0, 1fr)',
                'column-gap': '4px',
                'height': 'calc(56px + env(safe-area-inset-bottom, 0px))',
                'min-height': 'calc(56px + env(safe-area-inset-bottom, 0px))',
                'padding': '8px 10px calc(8px + env(safe-area-inset-bottom, 0px)) 8px'
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
                'background': '#ffffff',
                'background-color': '#ffffff',
                'box-shadow': 'none',
                'filter': 'none',
                'backdrop-filter': 'none',
                'height': '40px',
                'min-height': '40px',
                'max-height': '40px',
                'margin': '0 7px 0 0'
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
                'background-size': '31px 31px',
                'background-position': '50% calc(50% - 0.14px)'
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
                'background-size': '80px 80px',
                'background-position': '-44.05px -21.85px'
            }
        },
        {
            selector: '#wechat-continue-btn',
            properties: {
                'display': 'inline-flex',
                'background-image': 'url("./assets/send.svg")',
                'background-repeat': 'no-repeat',
                'background-size': '33px 33px',
                'background-position': '50% calc(50% - 0.5px)'
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
        var comboButton = document.getElementById('combo-btn');
        if (enabled && comboButton) comboButton.classList.remove('input-typing-hidden');
        RUNTIME_OVERRIDES.forEach(function (entry) {
            document.querySelectorAll(entry.selector).forEach(function (element) {
                if (enabled) {
                    if (!element.hasAttribute('data-wechat-original-style')) {
                        element.setAttribute('data-wechat-original-style', element.getAttribute('style') || '__none__');
                    }
                    Object.keys(entry.properties).forEach(function (property) {
                        var value = entry.properties[property];
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
        syncTypingHeader();
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
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (error) {
            return false;
        }
    }

    function storeMode(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
        } catch (error) {
            /* file:// privacy modes can reject storage; the active session still works. */
        }
    }

    function updateSettingsCard() {
        var card = document.getElementById('wechat-mode-settings-card');
        var status = document.getElementById('wechat-mode-card-status');
        if (!card) return;
        card.setAttribute('aria-checked', enabled ? 'true' : 'false');
        if (status) {
            status.textContent = enabled
                ? '已开启 · 微信日间布局与配色'
                : '已关闭 · 点击切换为微信日间样式';
        }
    }

    function syncThemeColor() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        if (originalThemeColor === null) {
            originalThemeColor = meta.getAttribute('content') || '#000000';
        }
        meta.setAttribute('content', enabled ? '#ededed' : originalThemeColor);
    }

    function applyMode(value, options) {
        options = options || {};
        enabled = Boolean(value);
        document.documentElement.setAttribute('data-wechat-mode', enabled ? 'true' : 'false');
        if (document.body) document.body.classList.toggle('wechat-mode', enabled);
        applyRuntimeOverrides();
        syncThemeColor();
        updateSettingsCard();
        if (options.persist !== false) storeMode(enabled);

        if (options.announce && typeof window.showNotification === 'function') {
            window.showNotification(enabled ? '微信模式已开启' : '微信模式已关闭', 'success');
        }
    }

    function toggleMode() {
        applyMode(!enabled, { persist: true, announce: true });
    }

    function createSettingsCard() {
        if (document.getElementById('wechat-mode-settings-card')) return;
        var grid = document.querySelector('#settings-modal .settings-grid');
        if (!grid) return;

        var card = document.createElement('div');
        card.id = 'wechat-mode-settings-card';
        card.className = 'settings-card';
        card.setAttribute('role', 'switch');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', '微信模式');
        card.innerHTML =
            '<span class="wechat-mode-card-icon"><i class="fab fa-weixin" aria-hidden="true"></i></span>' +
            '<span class="wechat-mode-card-copy"><strong>微信模式</strong>' +
            '<small id="wechat-mode-card-status"></small></span>' +
            '<span class="wechat-mode-switch" aria-hidden="true"></span>';

        card.addEventListener('click', toggleMode);
        card.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMode();
            }
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
            if (modal && typeof window.showModal === 'function') {
                window.showModal(modal);
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
        applyMode(readStoredMode(), { persist: false, announce: false });

        if (!runtimeObserver && document.body) {
            runtimeObserver = new MutationObserver(function (mutations) {
                if (!enabled) return;
                var needsRefresh = mutations.some(function (mutation) {
                    if (mutation.type === 'childList') return true;
                    return mutation.type === 'attributes' && mutation.attributeName === 'style' &&
                        mutation.target && mutation.target.matches &&
                        mutation.target.matches('.header, .header-inner, .header-right, .header-left, .header-actions, .header-right > .user-info:first-child, #dc-mobile-open-btn, #partner-name, .partner-name-line, .main-chat-area, .input-area-wrapper, .input-area, .message-input, #chat-plus-btn, #combo-btn, #wechat-continue-btn, .wx-clean-time-capsule, .wx-clean-time-capsule span, .custom-independent-label, .message-time, .msg-time, .time-label, .message-meta, .meta-timestamp, .discord-inline-timestamp, .timestamp, .msg-timestamp, .inline-timestamp, .read-receipt, .discord-read-receipt, .meta-read-receipt, .typing-indicator-label, .typing-indicator-settings-hint');
                });
                if (needsRefresh) scheduleRuntimeOverrides();
            });
            runtimeObserver.observe(document.getElementById('dc-main') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
        }

        /* The original page rebuilds a few panels after load; reattach only if needed. */
        [400, 1200, 2600].forEach(function (delay) {
            window.setTimeout(function () {
                createSettingsCard();
                createHeaderMoreButton();
                createWechatContinueButton();
                updateSettingsCard();
                syncThemeColor();
                applyRuntimeOverrides();
            }, delay);
        });
    }

    window.setWechatMode = function (value) {
        applyMode(value, { persist: true, announce: false });
    };
    window.toggleWechatMode = toggleMode;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
