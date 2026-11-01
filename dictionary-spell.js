(function () {
    'use strict';

    var DEFAULTS = {
        freeSentenceEnabled: true,
        freeSentenceProbability: 20,
        freeSentenceStyle: 'mix'
    };
    var FILL_WORDS = ['想你', '抱抱', '亲亲', '嘿嘿', '哦', '呀', '啦', '嘛', '呢', '想你了', '最喜欢你', '晚安', '早安'];
    var SUFFIXES = ['呀', '啦', '哦', '呢', '嘛', '哟', '嘿嘿'];
    var LIBRARY_KEY = 'wechat-free-sentence-library-v1';
    var GROUP_VISIBILITY_KEY = 'wechat-free-sentence-disabled-groups-v1';
    var DELETED_GROUPS_KEY = 'wechat-free-sentence-deleted-groups-v1';
    var lastSource = '';
    var segmentationDictionary;
    var maxWordLength = 4;
    var REMOVED_SCENE_GROUPS = new Set(['逛菜市场','厨房翻车记','异地时差','写日记','手账时间','看星星','露营时光','钓鱼安静','美术馆画廊','弹琴唱歌','学做甜品','快递开箱','换季大扫除','阳台晾晒','深夜聊心','午后阳光','周末计划','晨练公园','买花回家','装修琐事','看球赛','打游戏','做头发','买眼镜配镜','夜市烟火','写明信片','拍立得','拼图时光','桌游夜','天台看城','生病照顾','深夜食堂','奶茶排队','坐火车','机场送别','雨天在家','初雪那天','看日出','共享单车','宠物洗澡','种多肉','学化妆','试衣间','搬家打包','相册翻旧','抄歌词练字','坐过山车','逛花鸟市场','学游泳','海边捡石头','泡温泉','做指甲','买首饰','装台灯','看话剧','听演唱会','路边摊早餐','加班深夜','调休请假','体检日','拔牙看牙','买蛋糕','挑西瓜','削苹果皮','阳台看楼下','等电梯','挤电梯','仪式感餐桌','烛光晚餐','拍TA的角度','偷拍瞬间','情侣自拍姿势','天气应对','异地早晚安','屏幕那端的一日三餐','楼下小吃街','夜市烧烤摊','家门口新店试吃','背靠背','牵手走路的步调','肩膀借你','聊天记录翻旧','表情包收藏','打字错别字','深夜发消息又撤回','买面包','挑酸奶','逛便利店','做手冲咖啡','泡茶艺','做果酱','烤红薯','煲老火汤','煮火锅']);

    function getSettings() {
        try { return typeof settings === 'undefined' ? null : settings; } catch (error) { return null; }
    }
    function ensureSettings() {
        var value = getSettings();
        if (!value) return null;
        Object.keys(DEFAULTS).forEach(function (key) {
            if (typeof value[key] === 'undefined') value[key] = DEFAULTS[key];
        });
        return value;
    }
    function currentReplyCards() {
        var custom = [];
        try { custom = typeof customReplies !== 'undefined' && Array.isArray(customReplies) ? customReplies : (window._customReplies || []); } catch (error) { custom = window._customReplies || []; }
        return custom.filter(function (item, index, list) {
            return typeof item === 'string' && item.trim() && list.indexOf(item) === index;
        });
    }
    function libraryCustomCards() {
        try {
            var value = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]');
            return Array.isArray(value) ? value.filter(function (item) { return typeof item === 'string' && item.trim(); }) : [];
        } catch (error) { return []; }
    }
    function saveLibraryCustomCards(cards) {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(cards));
    }
    function disabledGroups() {
        try {
            var value = JSON.parse(localStorage.getItem(GROUP_VISIBILITY_KEY) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch (error) { return {}; }
    }
    /* Group labels are the stable identifiers: the optional current-card group
       can appear or disappear without moving another group's preference. */
    function groupKey(group) { return String(group && group[0] || '未命名分组'); }
    function isGroupDisabled(group, index) { return !!disabledGroups()[groupKey(group, index)]; }
    function setGroupDisabled(group, index, disabled) {
        var value = disabledGroups(), key = groupKey(group, index);
        if (disabled) value[key] = true;
        else delete value[key];
        localStorage.setItem(GROUP_VISIBILITY_KEY, JSON.stringify(value));
        segmentationDictionary = null;
    }
    function deletedGroups() {
        try {
            var value = JSON.parse(localStorage.getItem(DELETED_GROUPS_KEY) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch (error) { return {}; }
    }
    function deleteGroup(group) {
        var value = deletedGroups(), key = groupKey(group);
        if (key === '自建造句语料') {
            saveLibraryCustomCards([]);
            segmentationDictionary = null;
            return;
        }
        value[key] = true;
        localStorage.setItem(DELETED_GROUPS_KEY, JSON.stringify(value));
        var disabled = disabledGroups();
        delete disabled[key];
        localStorage.setItem(GROUP_VISIBILITY_KEY, JSON.stringify(disabled));
        segmentationDictionary = null;
    }
    function bankGroups() {
        var groups = Array.isArray(window.DICTIONARY_SPELL_BANK) ? window.DICTIONARY_SPELL_BANK.slice() : [];
        var current = currentReplyCards();
        var custom = libraryCustomCards();
        if (custom.length) groups.unshift(['自建造句语料', custom]);
        groups = current.length ? [['当前回复字卡', current]].concat(groups) : groups;
        var removed = deletedGroups();
        return groups.filter(function (group) { return !removed[groupKey(group)] && !REMOVED_SCENE_GROUPS.has(groupKey(group)); });
    }
    function allCards() {
        return bankGroups().reduce(function (all, group, index) {
            if (isGroupDisabled(group, index)) return all;
            return all.concat(Array.isArray(group && group[1]) ? group[1] : []);
        }, []).filter(function (item) {
            return typeof item === 'string' && item.length >= 4 && item.length <= 30 &&
                (item.match(/[\u4e00-\u9fff]/g) || []).length >= 4 && !/[\uD800-\uDBFF]/.test(item);
        });
    }
    function allWords() {
        if (segmentationDictionary) return segmentationDictionary;
        segmentationDictionary = new Set();
        bankGroups().forEach(function (group, index) {
            if (isGroupDisabled(group, index)) return;
            if (!String(group && group[0]).startsWith('词库')) return;
            (group[1] || []).forEach(function (word) {
                if (typeof word === 'string' && word.length >= 2) {
                    segmentationDictionary.add(word);
                    maxWordLength = Math.min(8, Math.max(maxWordLength, word.length));
                }
            });
        });
        return segmentationDictionary;
    }
    function segment(text) {
        var value = String(text || ''), dictionary = allWords(), result = [], index = 0;
        while (index < value.length) {
            if (!/[\u4e00-\u9fff]/.test(value[index])) {
                var end = index + 1;
                while (end < value.length && !/[\u4e00-\u9fff]/.test(value[end])) end += 1;
                result.push(value.slice(index, end)); index = end; continue;
            }
            var length = 0;
            for (var size = Math.min(maxWordLength, value.length - index); size >= 2; size -= 1) {
                if (dictionary.has(value.slice(index, index + size))) { length = size; break; }
            }
            result.push(value.slice(index, index + (length || 1)));
            index += length || 1;
        }
        return result;
    }
    function wordPool(exclude) {
        var words = [];
        allCards().forEach(function (card) {
            if (card === exclude) return;
            segment(card).forEach(function (word) {
                if (word.length >= 2 && /[\u4e00-\u9fff]/.test(word) && words.indexOf(word) < 0) words.push(word);
            });
        });
        return words;
    }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function rebuild(source, mode) {
        var text = String(source || '');
        var clean = text.replace(/[，。！？、…～\s]+$/, '');
        var tokens = segment(text);
        if (mode === 'recall') {
            if (tokens.length < 3) return null;
            var point = 2 + Math.floor(Math.random() * Math.max(1, tokens.length - 2));
            var recalled = tokens.slice(0, point).join('').replace(/[，、,\s]+$/, '');
            return recalled.length >= 4 && recalled !== text ? recalled : null;
        }
        if (mode === 'suffix') return clean.length >= 3 ? clean + pick(SUFFIXES) : null;
        if (mode === 'tailcut') return clean.length >= 5 ? clean.slice(0, -(1 + Math.floor(Math.random() * 2))) : null;
        if (mode === 'addtail') {
            var tail = pick(wordPool(text)) || pick(SUFFIXES);
            return clean.length >= 3 && tail ? clean + tail : null;
        }
        if (tokens.length < 3) return null;
        var gaps = [];
        for (var i = 1; i < tokens.length; i += 1) {
            if (/[\u4e00-\u9fff]/.test(tokens[i - 1]) && /[\u4e00-\u9fff]/.test(tokens[i])) gaps.push(i);
        }
        if (!gaps.length) return null;
        var gap = pick(gaps);
        if (mode === 'cutfill') {
            var rest = tokens.slice(gap);
            var filler = pick(wordPool(text)) || pick(FILL_WORDS);
            return tokens.slice(0, gap).join('') + filler + rest.slice(1).join('');
        }
        return tokens.slice(0, gap).join('') + (mode === 'comma' ? '，' : ' ') + tokens.slice(gap).join('');
    }
    function addPunctuation(text) {
        if (!text || /[。．！？!?~～…，、,.;；:：）)”’"]$/.test(text)) return text;
        return text + pick(['。', '。', '。', '~', '！', '……']);
    }

    window.pickFreeSentence = function () {
        var value = ensureSettings();
        if (!value || !value.freeSentenceEnabled || Math.random() * 100 >= Number(value.freeSentenceProbability)) return null;
        var corpus = allCards();
        if (!corpus.length) return null;
        var requested = value.freeSentenceStyle || 'mix';
        for (var attempt = 0; attempt < 8; attempt += 1) {
            var source = pick(corpus);
            if (source === lastSource) continue;
            var style = requested === 'mix' ? pick(['tone', 'recall', 'replace']) : requested;
            var mode = style === 'tone' ? pick(['cutfill', 'comma', 'space', 'suffix', 'tailcut']) :
                style === 'recall' ? pick(['recall', 'comma', 'space']) :
                pick(['cutfill', 'comma', 'space', 'addtail', 'tailcut']);
            var output = addPunctuation(rebuild(source, mode));
            if (output && output !== source) { lastSource = source; return output; }
        }
        return null;
    };

    function save() { try { if (typeof throttledSaveData === 'function') throttledSaveData(); } catch (error) {} }
    function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]; }); }
    function close(modal) { modal.style.display = 'none'; }
    function renderLibrary(query) {
        var host = document.getElementById('free-sentence-list');
        if (!host) return;
        var needle = String(query || '').trim(), html = [];
        bankGroups().forEach(function (group, index) {
            var cards = (group[1] || []).filter(function (card) { return !needle || card.indexOf(needle) >= 0; });
            var editable = group[0] === '自建造句语料';
            var disabled = isGroupDisabled(group, index);
            if (!cards.length && needle) return;
            html.push('<section class="free-sentence-group' + (disabled ? ' is-disabled' : '') + '"><h4><span>' + escapeHTML(group[0]) + '<small>' + cards.length + ' 条</small></span><span class="free-sentence-group-actions"><button type="button" class="free-sentence-group-toggle" data-group-index="' + index + '">' + (disabled ? '已屏蔽' : '启用中') + '</button><button type="button" class="free-sentence-group-delete" data-group-index="' + index + '">删除本组</button></span></h4><div>' + cards.map(function (card) {
                return '<span>' + escapeHTML(card) + (editable ? '<button type="button" class="free-sentence-delete" data-card="' + encodeURIComponent(card) + '" aria-label="删除语料">×</button>' : '') + '</span>';
            }).join('') + '</div></section>');
        });
        host.innerHTML = html.join('') || '<p class="free-sentence-empty">没有匹配的词条</p>';
    }
    function mountStyle() {
        if (document.getElementById('free-sentence-style')) return;
        var style = document.createElement('style');
        style.id = 'free-sentence-style';
        style.textContent = '#free-sentence-modal .modal-content,#free-sentence-library .modal-content{max-width:520px}.free-sentence-panel{display:grid;gap:14px}.free-sentence-panel h3{margin:0;font-size:18px}.free-sentence-intro{margin:0;color:var(--text-secondary,#777);font-size:13px;line-height:1.65}.free-sentence-control{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--border-color,rgba(0,0,0,.08))}.free-sentence-control label:first-child{font-size:14px}.free-sentence-control input[type=range]{width:160px;accent-color:var(--accent-color,#07c160)}.free-sentence-number{min-width:38px;text-align:right;color:var(--text-secondary,#777);font-variant-numeric:tabular-nums}.free-sentence-segmented{display:flex;border:1px solid var(--border-color,rgba(0,0,0,.12));border-radius:8px;overflow:hidden}.free-sentence-segmented button{border:0;background:transparent;color:var(--text-secondary,#666);padding:7px 10px;cursor:pointer}.free-sentence-segmented button.active{background:var(--accent-color,#07c160);color:#fff}.free-sentence-library-btn{width:100%;border:1px solid var(--border-color,rgba(0,0,0,.12));background:var(--secondary-bg,#f5f5f5);color:var(--text-primary,#222);border-radius:9px;padding:10px;cursor:pointer}.free-sentence-library-btn small{color:var(--text-secondary,#777);margin-left:6px}.free-sentence-search{width:100%;padding:10px 12px;border:1px solid var(--border-color,rgba(0,0,0,.12));border-radius:8px;background:var(--input-bg,#fff);color:var(--text-primary,#222)}#free-sentence-list{max-height:52vh;overflow:auto;margin-top:12px;padding-right:4px}.free-sentence-group{padding:10px 0;border-bottom:1px solid var(--border-color,rgba(0,0,0,.08))}.free-sentence-group h4{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px;font-size:13px}.free-sentence-group h4>span{display:flex;gap:6px;align-items:baseline}.free-sentence-group h4 small{font-weight:400;color:var(--text-secondary,#777)}.free-sentence-group-actions{flex:0 0 auto;align-items:center!important}.free-sentence-group-toggle,.free-sentence-group-delete{border:1px solid var(--border-color,rgba(0,0,0,.12));border-radius:999px;background:transparent;color:var(--text-secondary,#666);padding:3px 8px;font-size:11px;cursor:pointer}.free-sentence-group-delete{color:#d95151}.free-sentence-group:not(.is-disabled) .free-sentence-group-toggle{color:var(--accent-color,#07c160);border-color:var(--accent-color,#07c160)}.free-sentence-group.is-disabled>div{opacity:.38;filter:grayscale(1)}.free-sentence-group>div{display:flex;flex-wrap:wrap;gap:6px}.free-sentence-group span{padding:4px 7px;border-radius:6px;background:var(--secondary-bg,rgba(0,0,0,.05));font-size:12px;color:var(--text-primary,#333)}.free-sentence-empty{color:var(--text-secondary,#777);text-align:center;padding:26px 0}';
        style.textContent += '.free-sentence-group h4>span{padding:0;background:transparent;border-radius:0;font-size:inherit;color:inherit}.free-sentence-group h4 .free-sentence-group-actions{display:flex;gap:6px;align-items:center}';
        document.head.appendChild(style);
    }
    function syncModal() {
        var modal = document.getElementById('free-sentence-modal'), value = ensureSettings();
        if (!modal || !value) return;
        modal.querySelector('#free-sentence-enabled').checked = !!value.freeSentenceEnabled;
        modal.querySelector('#free-sentence-probability').value = value.freeSentenceProbability;
        modal.querySelector('#free-sentence-probability-value').textContent = value.freeSentenceProbability + '%';
        modal.querySelectorAll('[data-style]').forEach(function (button) { button.classList.toggle('active', button.dataset.style === value.freeSentenceStyle); });
        modal.querySelector('.free-sentence-library-btn small').textContent = allCards().length.toLocaleString() + ' 条语料';
    }
    function mountModals() {
        if (document.getElementById('free-sentence-modal')) return;
        mountStyle();
        var modal = document.createElement('div');
        modal.id = 'free-sentence-modal'; modal.className = 'modal';
        modal.innerHTML = '<div class="modal-content"><div class="modal-header"><h2>梦角自由造句</h2><button type="button" class="close-modal" aria-label="关闭">×</button></div><div class="free-sentence-panel"><p class="free-sentence-intro">让对方从当前回复字卡和内置语料中截词、换词或改写语气，生成新的句子发出。</p><div class="free-sentence-control"><label for="free-sentence-enabled">启用自由造句</label><input id="free-sentence-enabled" type="checkbox"></div><div class="free-sentence-control"><label for="free-sentence-probability">触发概率</label><span><input id="free-sentence-probability" type="range" min="0" max="100" step="5"><b class="free-sentence-number" id="free-sentence-probability-value"></b></span></div><div class="free-sentence-control"><label>造句方式</label><span class="free-sentence-segmented"><button type="button" data-style="tone">语气</button><button type="button" data-style="recall">截断</button><button type="button" data-style="replace">换词</button><button type="button" data-style="mix">随机</button></span></div><button class="free-sentence-library-btn" type="button">查看全部语料 <small></small></button></div></div>';
        var library = document.createElement('div');
        library.id = 'free-sentence-library'; library.className = 'modal';
        library.innerHTML = '<div class="modal-content"><div class="modal-header"><h2>造句语料库</h2><button type="button" class="close-modal" aria-label="关闭">×</button></div><div style="display:flex;gap:8px;margin-bottom:10px"><input class="free-sentence-add" type="text" placeholder="添加自建语料" style="flex:1;padding:10px 12px;border:1px solid var(--border-color,rgba(0,0,0,.12));border-radius:8px;background:var(--input-bg,#fff);color:var(--text-primary,#222)"><button type="button" class="free-sentence-add-btn" style="padding:0 13px;border:0;border-radius:8px;background:var(--accent-color,#07c160);color:#fff;cursor:pointer">添加</button></div><input class="free-sentence-search" type="search" placeholder="搜索词条"><div id="free-sentence-list"></div></div>';
        document.body.appendChild(modal); document.body.appendChild(library);
        [modal, library].forEach(function (item) { item.addEventListener('click', function (event) { if (event.target === item) close(item); }); item.querySelector('.close-modal').addEventListener('click', function () { close(item); }); });
        modal.querySelector('#free-sentence-enabled').addEventListener('input', function (event) { ensureSettings().freeSentenceEnabled = event.target.checked; save(); });
        modal.querySelector('#free-sentence-probability').addEventListener('input', function (event) { ensureSettings().freeSentenceProbability = Number(event.target.value); syncModal(); save(); });
        modal.querySelectorAll('[data-style]').forEach(function (button) { button.addEventListener('click', function () { ensureSettings().freeSentenceStyle = button.dataset.style; syncModal(); save(); }); });
        modal.querySelector('.free-sentence-library-btn').addEventListener('click', function () { library.style.display = 'flex'; renderLibrary(''); var input = library.querySelector('.free-sentence-search'); input.value = ''; input.focus(); });
        library.querySelector('.free-sentence-search').addEventListener('input', function (event) { renderLibrary(event.target.value); });
        library.querySelector('.free-sentence-add-btn').addEventListener('click', function () {
            var input = library.querySelector('.free-sentence-add');
            var text = String(input.value || '').trim();
            if (!text) return;
            var cards = libraryCustomCards();
            if (cards.indexOf(text) < 0) {
                cards.push(text);
                saveLibraryCustomCards(cards);
            }
            input.value = '';
            renderLibrary(library.querySelector('.free-sentence-search').value);
        });
        library.querySelector('#free-sentence-list').addEventListener('click', function (event) {
            var deleteGroupButton = event.target.closest('.free-sentence-group-delete');
            if (deleteGroupButton) {
                var deleteIndex = Number(deleteGroupButton.getAttribute('data-group-index'));
                var deleteTarget = bankGroups()[deleteIndex];
                if (deleteTarget && window.confirm('确认删除“' + deleteTarget[0] + '”整个分组吗？该组将不再参与自由造句。')) {
                    deleteGroup(deleteTarget);
                    renderLibrary(library.querySelector('.free-sentence-search').value);
                    syncModal();
                }
                return;
            }
            var toggle = event.target.closest('.free-sentence-group-toggle');
            if (toggle) {
                var index = Number(toggle.getAttribute('data-group-index'));
                var group = bankGroups()[index];
                if (group) setGroupDisabled(group, index, !isGroupDisabled(group, index));
                renderLibrary(library.querySelector('.free-sentence-search').value);
                syncModal();
                return;
            }
            var button = event.target.closest('.free-sentence-delete');
            if (!button) return;
            var card = decodeURIComponent(button.getAttribute('data-card') || '');
            saveLibraryCustomCards(libraryCustomCards().filter(function (item) { return item !== card; }));
            renderLibrary(library.querySelector('.free-sentence-search').value);
        });
    }
    function openSettings() { mountModals(); syncModal(); document.getElementById('free-sentence-modal').style.display = 'flex'; }
    function mountCard() {
        var grid = document.querySelector('#settings-modal .settings-grid');
        if (!grid || document.getElementById('free-sentence-settings-card')) return;
        var card = document.createElement('div');
        card.id = 'free-sentence-settings-card'; card.className = 'settings-card'; card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
        card.innerHTML = '<i class="fas fa-magic" aria-hidden="true"></i><span>梦角自由造句</span>';
        card.addEventListener('click', openSettings);
        card.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSettings(); } });
        grid.appendChild(card);
    }
    function initialize() { ensureSettings(); mountCard(); [600, 1600, 3000].forEach(function (delay) { setTimeout(mountCard, delay); }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true }); else initialize();
})();
