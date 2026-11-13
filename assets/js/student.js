(function () {
  const C = window.KIERA.core;
  const app = document.getElementById('app');
  const toastRoot = document.getElementById('toastRoot');
  const modalRoot = document.getElementById('modalRoot');
  let student = C.currentUser('student');
  let chat = [];
  let pendingAsk = '';
  let homeDept = '';

  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8M8 14h5"/>',
    play: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 9 5 3-5 3Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17.5v.5"/>',
    pin: '<path d="m9 4 6 0-1 6 3 3H7l3-3-1-6Z"/><path d="M12 13v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    send: '<path d="m22 2-9 20-2.5-8.5L2 11 22 2Z"/><path d="M10.5 13.5 22 2"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    news: '<path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
    shield: '<path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.4 2.4 4.6-5"/>',
    logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.7"/><path d="M20 4v7h-7"/>',
    location: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    userGroup: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3-5.4 6.5-5.4s5.9 1.9 6.5 5.4"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M17.5 15c2.4.5 3.8 2.2 4.2 5"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';
  }

  function go(path, params) {
    const query = params ? new URLSearchParams(Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; }).map(function (k) { return [k, params[k]]; })).toString() : '';
    const target = '#' + path + (query ? '?' + query : '');
    if (location.hash === target) render();
    else location.hash = target;
  }

  function currentRoute() {
    let raw = location.hash.replace(/^#/, '') || '/home';
    const parts = raw.split('?');
    return { path: parts[0] || '/home', params: new URLSearchParams(parts[1] || '') };
  }

  function escapeHtml(value) {
    return C.escapeHtml(value);
  }

  function noticeHref(id, from) {
    return '#/notice/' + id + (from ? '?from=' + encodeURIComponent(from) : '');
  }

  function newsHref(id) {
    return '#/news/' + id;
  }

  function videoHref(id) {
    return '#/video/' + id;
  }

  function picture(item, fallback) {
    return item.cover_image || fallback || '';
  }

  function coverImage(item, alt, fallback) {
    const placeholder = fallback || 'assets/images/brand/placeholder-news.svg';
    if (item.cover_image) return '<img src="' + escapeHtml(item.cover_image) + '" alt="' + escapeHtml(alt) + '" loading="lazy">';
    if (item.cover_key) return '<img src="' + placeholder + '" data-cover-key="' + escapeHtml(item.cover_key) + '" alt="' + escapeHtml(alt) + '" loading="lazy">';
    return '';
  }

  function showToast(message, type) {
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.innerHTML = icon(type === 'error' ? 'alert' : type === 'warning' ? 'alert' : 'check') + '<span>' + escapeHtml(message) + '</span>';
    toastRoot.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 220);
    }, 3800);
  }

  function openDialog(title, body, footer) {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog';
    dialog.innerHTML = '<div class="dialog-head"><h2>' + escapeHtml(title) + '</h2><button class="dialog-close" type="button">' + icon('close') + '</button></div>'
      + '<div class="dialog-body">' + body + '</div>'
      + (footer ? '<div class="dialog-foot">' + footer + '</div>' : '');
    modalRoot.appendChild(dialog);
    dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { setTimeout(function () { dialog.remove(); }, 80); });
    dialog.showModal();
    return dialog;
  }

  function unreadCount() {
    if (!student) return 0;
    return C.unreadNotices(student).length;
  }

  function topbar(title, options) {
    options = options || {};
    const unread = unreadCount();
    if (options.brand) {
      return '<header class="topbar"><span class="top-seal">匠</span><a class="top-brand" href="#/home"><strong>校园信息港</strong><span>江苏省张家港中等专业学校</span></a>'
        + '<button class="top-action" type="button" data-action="notifications" aria-label="通知">' + icon('bell') + (unread ? '<span class="top-badge">' + unread + '</span>' : '') + '</button></header>';
    }
    return '<header class="topbar"><button class="top-back" type="button" data-action="back" data-fallback="' + escapeHtml(options.back || '/home') + '" aria-label="返回">' + icon('back') + '</button>'
      + '<div class="top-page">' + escapeHtml(title) + '</div>'
      + '<button class="top-action" type="button" data-action="notifications" aria-label="通知">' + icon('bell') + (unread ? '<span class="top-badge">' + unread + '</span>' : '') + '</button></header>';
  }

  function tabbar(active) {
    const unread = unreadCount();
    const tabs = [
      ['home', '/home', '首页', 'home'],
      ['notices', '/notices', '公告', 'bell'],
      ['videos', '/videos', '视频', 'play'],
      ['profile', '/profile', '我的', 'user']
    ];
    return '<nav class="bottom-nav">' + tabs.map(function (tab) {
      return '<a class="tab-item ' + (active === tab[0] ? 'active' : '') + '" href="#' + tab[1] + '">' + icon(tab[3])
        + (tab[0] === 'home' && unread ? '<span class="tab-badge">' + unread + '</span>' : '') + '<span>' + tab[2] + '</span></a>';
    }).join('') + '</nav>';
  }

  function shell(title, active, content, options) {
    options = options || {};
    document.title = title + ' · 校园信息港';
    app.classList.remove('welcome-mode');
    app.classList.toggle('no-tab', !!options.hideTab);
    app.innerHTML = topbar(title, options) + '<main class="page ' + (options.className || '') + '">' + content + '</main>' + (options.hideTab ? '' : tabbar(active)) + (options.floatingAsk ? '<a class="ask-fab" href="#/ask">' + icon('chat') + '<span>问答</span></a>' : '');
    afterRender(options);
  }

  function afterRender(options) {
    C.hydrateMedia(document);
    if (options && options.focusAsk) {
      const input = document.querySelector('.ask-input input');
      if (input) setTimeout(function () { input.focus(); }, 120);
    }
    if (options && options.scrollTop !== false) window.scrollTo(0, 0);
  }

  function departmentCard(dept, count, latest) {
    const blueMap = { jx: '#1e5f93', xx: '#2b7db6', jm: '#3d7099', ny: '#4f86a8', zk: '#326b98' };
    const color = dept ? (blueMap[dept.id] || '#2b7db6') : '#155f96';
    const name = dept ? dept.name : '全校通知';
    return '<a class="dept-card" style="--dept-color:' + color + '" href="' + (dept ? '#/notices?dept=' + dept.id : '#/notices?scope=all') + '">'
      + '<div class="dept-card-top"><strong>' + escapeHtml(name) + '</strong><em>' + count + ' 条</em></div>'
      + '<p>' + escapeHtml(latest ? latest.title : '暂无最新通知') + '</p>'
      + '<small>' + (latest ? C.relativeTime(latest.published_at) : '等待发布') + '</small></a>';
  }

  function noticeCard(notice) {
    return '<article class="notice-card ' + (Number(notice.is_pinned) ? 'is-pinned' : '') + '"><div class="notice-top">'
      + '<span class="badge ' + C.categoryClass(notice.category) + '">' + escapeHtml(notice.category) + '</span>'
      + '<span class="badge badge-' + notice.priority + '">' + C.priorityText(notice.priority) + '</span>'
      + '<span class="badge ' + (notice.scope === 'all' ? 'badge-all' : 'badge-dept') + '">' + escapeHtml(C.scopeText(notice)) + '</span>'
      + '</div><h3><a href="' + noticeHref(notice.id, 'list') + '">' + escapeHtml(notice.title) + '</a></h3>'
      + '<div class="notice-bottom"><span>' + icon('clock') + C.relativeTime(notice.published_at) + '</span>'
      + '<span>' + Number(notice.views || 0) + ' 次查看</span></div></article>';
  }

  function newsCard(news) {
    const pic = picture(news);
    return '<a class="news-mini" href="' + newsHref(news.id) + '">'
      + (pic ? '<span class="news-mini-image">' + coverImage(news, news.title) + '</span>' : '')
      + '<span class="news-mini-copy"><span>' + escapeHtml(news.category) + '</span><h3>' + escapeHtml(news.title) + '</h3></span></a>';
  }

  function videoCard(video) {
    const pic = picture(video, '');
    return '<a class="video-mini" href="' + videoHref(video.id) + '"><span class="video-thumb">'
      + coverImage(video, video.title, 'assets/images/brand/placeholder-video.svg')
      + '<span class="play-dot">' + icon('play') + '</span></span><span class="video-mini-copy"><h3>' + escapeHtml(video.title) + '</h3>'
      + '<span>' + Number(video.views || 0) + ' 次播放</span></span></a>';
  }

  function deptTabs(activeId) {
    const tabs = [{ id: 'all', name: '全校' }].concat(C.departments().map(function (d) {
      return { id: d.id, name: d.short || d.name.replace('系', '') };
    }));
    return '<div class="dept-tabs">' + tabs.map(function (tab) {
      return '<button class="dept-tab ' + (activeId === tab.id ? 'active' : '') + '" type="button" data-dept-tab="' + tab.id + '">' + escapeHtml(tab.name) + '</button>';
    }).join('') + '</div>';
  }

  function departmentPanel(activeId) {
    const isAll = activeId === 'all';
    const dept = isAll ? null : C.departmentById(activeId);
    const list = C.visibleNotices(null).filter(function (n) {
      if (isAll) return n.scope === 'all';
      return n.scope === 'dept' && n.department === activeId;
    });
    const shown = list.slice(0, 4);
    const head = '<div class="dept-panel-head"><div><strong>' + escapeHtml(isAll ? '全校通知' : (dept ? dept.name : '系部通知')) + '</strong>'
      + '<span>' + list.length + ' 条通知</span></div>'
      + '<a href="#/notices' + (isAll ? '?scope=all' : '?dept=' + activeId) + '">查看全部' + icon('arrow') + '</a></div>';
    const body = shown.length
      ? '<div class="dept-notice-list">' + shown.map(function (n) {
        return '<a class="dept-notice" href="' + noticeHref(n.id, 'home') + '"><span class="dept-notice-title">' + escapeHtml(n.title) + '</span>'
          + '<span class="dept-notice-meta">' + escapeHtml(n.category) + ' · ' + C.relativeTime(n.published_at) + '</span></a>';
      }).join('') + '</div>'
      : '<div class="dept-empty">' + icon('bell') + '<span>该系部暂时没有通知</span></div>';
    return '<section class="section dept-section"><div class="section-head"><h2>系部信息</h2><a href="#/notices">全部公告</a></div>'
      + deptTabs(activeId) + '<div class="dept-panel">' + head + body + '</div></section>';
  }

  function renderHome() {
    const notices = C.visibleNotices(student);
    const urgent = notices.find(function (n) { return n.priority === 'urgent'; }) || notices[0] || null;
    const latest = notices.filter(function (n) { return !urgent || n.id !== urgent.id; }).slice(0, 4);
    const news = C.state.news.slice().sort(function (a, b) { return C.parseDate(b.published_at) - C.parseDate(a.published_at); });
    const newsWithPic = news.filter(function (n) { return n.cover_image || n.cover_key; }).slice(0, 3);
    const videos = C.state.videos.filter(function (v) { return v.status === 'approved'; })
      .sort(function (a, b) { return C.parseDate(b.reviewed_at) - C.parseDate(a.reviewed_at); }).slice(0, 3);
    const headTitle = student ? C.departmentName(student.department) : '全校信息';
    const headSub = student ? (student.title || '学生') : '登录后接收你所在系部的通知';
    if (!homeDept) homeDept = student && student.department ? student.department : 'all';

    const urgentHtml = urgent ? '<a class="urgent-card" href="' + noticeHref(urgent.id, 'home') + '"><span class="urgent-icon">' + icon('alert') + '</span>'
      + '<span class="urgent-copy"><span class="urgent-meta"><strong>' + (urgent.priority === 'urgent' ? '紧急通知' : '重要通知') + '</strong>' + escapeHtml(C.scopeText(urgent)) + '</span>'
      + '<h3>' + escapeHtml(urgent.title) + '</h3><p>' + escapeHtml(urgent.summary) + '</p></span><span class="urgent-arrow">' + icon('arrow') + '</span></a>' : '';

    const content = '<div class="home-head"><div><h1>你好，' + (student ? escapeHtml(student.real_name) : '同学') + '</h1>'
      + '<p>' + escapeHtml(headTitle) + ' · ' + escapeHtml(headSub) + '</p></div>'
      + (student ? '<span class="dept-pill">' + escapeHtml(C.departmentName(student.department).replace('系', '')) + '</span>' : '<a class="dept-pill" href="#/login">登录</a>') + '</div>'
      + urgentHtml
      + '<section class="section"><div class="section-head"><h2>最新公告</h2><a href="#/notices">查看全部</a></div>'
      + (latest.length ? '<div class="notice-list">' + latest.map(noticeCard).join('') + '</div>' : '<div class="empty">' + icon('bell') + '<p>暂时没有新公告</p></div>') + '</section>'
      + departmentPanel(homeDept)
      + '<section class="section"><div class="section-head"><h2>校园新闻</h2><a href="#/news">更多</a></div>'
      + (newsWithPic.length ? '<div class="news-strip">' + newsWithPic.map(newsCard).join('') + '</div>' : '<div class="empty">' + icon('news') + '<p>暂时没有新闻</p></div>') + '</section>'
      + '<section class="section"><div class="section-head"><h2>校园视频</h2><a href="#/videos">更多</a></div>'
      + (videos.length ? '<div class="video-strip">' + videos.map(videoCard).join('') + '</div>' : '<div class="empty">' + icon('play') + '<p>暂时没有视频</p></div>') + '</section>';

    shell('首页', 'home', content, { brand: true, floatingAsk: true, scrollTop: false });
  }

  function renderNotices(params) {
    const q = (params.get('q') || '').trim();
    const category = params.get('category') || '';
    const scope = params.get('scope') || '';
    const deptId = params.get('dept') || '';
    let list = C.visibleNotices(student);
    if (category) list = list.filter(function (n) { return n.category === category; });
    if (scope === 'all') list = list.filter(function (n) { return n.scope === 'all'; });
    if (scope === 'dept') list = list.filter(function (n) { return n.scope === 'dept'; });
    if (deptId) list = list.filter(function (n) { return n.department === deptId; });
    if (q) {
      list = list.filter(function (n) {
        return (n.title + n.summary + n.content).toLowerCase().indexOf(q.toLowerCase()) >= 0;
      });
    }
    const chips = [['', '全部'], ['通学出行', '通学出行'], ['教学安排', '教学安排'], ['安全提醒', '安全提醒'], ['活动比赛', '活动比赛'], ['系部通知', '系部通知'], ['校园生活', '校园生活'], ['后勤服务', '后勤服务']];
    const filterChips = '<div class="filter-scroll">' + chips.map(function (item) {
      return '<a class="filter-chip ' + (category === item[0] ? 'active' : '') + '" href="#/notices' + (item[0] ? '?category=' + encodeURIComponent(item[0]) : '') + '">' + item[1] + '</a>';
    }).join('') + '</div>';
    const content = '<div class="page-head"><h1>校园公告</h1><p>全校通知与各系部安排</p></div>'
      + '<div class="filter-box"><form class="search-line" data-form="notice-search">' + icon('search') + '<input type="search" name="q" value="' + escapeHtml(q) + '" placeholder="搜索公告标题或内容">'
      + '</form>' + filterChips
      + '<div class="filter-row"><select data-filter="dept" aria-label="按系部筛选"><option value="">全部系部</option>' + C.departments().map(function (d) {
        return '<option value="' + d.id + '"' + (deptId === d.id ? ' selected' : '') + '>' + d.name + '</option>';
      }).join('') + '</select><select data-filter="scope" aria-label="按范围筛选"><option value="">全部范围</option><option value="all"' + (scope === 'all' ? ' selected' : '') + '>全校</option><option value="dept"' + (scope === 'dept' ? ' selected' : '') + '>系部</option></select></div></div>'
      + '<div class="result-count">共 ' + list.length + ' 条公告</div>'
      + (list.length ? '<div class="notice-list">' + list.map(noticeCard).join('') + '</div>' : '<div class="empty">' + icon('search') + '<h2>没有找到相关公告</h2><p>换个关键词，或查看其他系部的通知。</p></div>');
    shell('校园公告', 'notices', content, { back: '/home' });
  }

  function renderNotice(id) {
    const notice = C.noticeById(id);
    if (!notice) {
      shell('公告', 'notices', '<div class="empty">' + icon('alert') + '<h2>公告不存在</h2><p>这条公告可能已经被删除。</p><a class="btn btn-outline" href="#/notices">返回公告列表</a></div>', { back: '/notices' });
      return;
    }
    notice.views = Number(notice.views || 0) + 1;
    C.save();
    if (student) C.markNoticeRead(student, notice.id);
    const related = C.visibleNotices(student).filter(function (n) { return n.id !== notice.id && (n.category === notice.category || n.department === notice.department); }).slice(0, 3);
    const content = '<div class="notice-detail-head"><div class="detail-badges"><span class="badge ' + C.categoryClass(notice.category) + '">' + escapeHtml(notice.category) + '</span>'
      + '<span class="badge badge-' + notice.priority + '">' + C.priorityText(notice.priority) + '</span>'
      + '<span class="badge ' + (notice.scope === 'all' ? 'badge-all' : 'badge-dept') + '">' + escapeHtml(C.scopeText(notice)) + '</span></div>'
      + '<h1>' + escapeHtml(notice.title) + '</h1><div class="detail-meta"><span>' + icon('clock') + C.formatDate(notice.published_at, true) + '</span>'
      + '<span>' + icon('eye') + Number(notice.views) + ' 次查看</span><span>' + icon('user') + escapeHtml(notice.publisher_name) + '</span></div></div>'
      + '<article class="notice-content">' + escapeHtml(notice.content) + '</article>'
      + '<div class="notice-source">' + icon('shield') + '<span>本公告由' + escapeHtml(notice.publisher_name) + '发布，发布范围为' + escapeHtml(C.scopeText(notice)) + '。信息如有更新，以学校最新通知为准。</span></div>'
      + '<div class="detail-actions"><button class="btn btn-soft" type="button" data-copy-link>' + icon('link') + '复制链接</button></div>'
      + (related.length ? '<section class="related-block"><h2>相关公告</h2>' + related.map(function (n) {
        return '<a class="related-link" href="' + noticeHref(n.id, 'related') + '"><span></span>' + escapeHtml(n.title) + '</a>';
      }).join('') + '</section>' : '');
    shell('公告详情', 'notices', content, { back: '/notices' });
  }

  function renderAsk(params) {
    const initial = params.get('q') || '';
    if (initial && !chat.some(function (m) { return m.role === 'user' && m.text === initial; })) {
      chat.push({ role: 'user', text: initial });
      const result = C.askAI(initial, student);
      chat.push({ role: 'bot', text: result.answer, sources: result.sources });
    }
    if (!chat.length) {
      chat.push({ role: 'bot', text: '你可以问我校园公告、系部安排、新闻或视频。比如“通学路维修到什么时候”“信息工程系最近有什么通知”。', sources: [] });
    }
    const content = '<div class="ask-page"><div class="ask-intro"><h1>校园问答</h1><p>从校园公告、新闻和视频里查找答案</p></div>'
      + '<div class="chat-list" id="chatList">' + chat.map(function (msg) {
        if (msg.role === 'user') return '<div class="chat-row user"><span class="chat-avatar">我</span><div class="chat-bubble">' + escapeHtml(msg.text) + '</div></div>';
        return '<div class="chat-row"><span class="chat-avatar">问</span><div class="chat-bubble">' + escapeHtml(msg.text)
          + (msg.sources && msg.sources.length ? '<div class="chat-sources">' + msg.sources.map(function (s) {
            const item = s.item;
            const href = s.type === 'notice' ? noticeHref(item.id, 'ask') : s.type === 'news' ? newsHref(item.id) : videoHref(item.id);
            return '<a class="chat-source" href="' + href + '"><span>' + (s.type === 'notice' ? '公告' : s.type === 'news' ? '新闻' : '视频') + '</span>' + escapeHtml(item.title) + '</a>';
          }).join('') + '</div>' : '') + '</div></div>';
      }).join('') + '</div>'
      + '<div class="suggest-list"><button type="button" data-question="通学路施工到什么时候">通学路施工</button><button type="button" data-question="信息工程系最近有什么通知">信息工程系通知</button><button type="button" data-question="消防演练是哪天">消防演练</button></div>'
      + '<div class="ask-input-wrap"><form class="ask-input" data-form="ask">' + icon('chat') + '<input type="search" name="q" placeholder="输入你的问题" aria-label="输入问题" autocomplete="off"><button type="submit" aria-label="发送">' + icon('send') + '</button></form></div></div>';
    shell('校园问答', 'ask', content, { back: '/home', className: 'page-no-pad', focusAsk: true });
    const list = document.getElementById('chatList');
    if (list) setTimeout(function () { list.scrollIntoView({ block: 'end' }); }, 80);
  }

  function renderNewsList(params) {
    const category = params.get('category') || '';
    let list = C.state.news.slice().sort(function (a, b) { return C.parseDate(b.published_at) - C.parseDate(a.published_at); });
    if (category) list = list.filter(function (n) { return n.category === category; });
    const categories = ['', '竞赛获奖', '校园活动', '通知公告', '学校故事'];
    const content = '<div class="page-head"><h1>校园新闻</h1><p>学校发展与校园现场</p></div>'
      + '<div class="filter-scroll">' + categories.map(function (cat) {
        return '<a class="filter-chip ' + (category === cat ? 'active' : '') + '" href="#/news' + (cat ? '?category=' + encodeURIComponent(cat) : '') + '">' + (cat || '全部') + '</a>';
      }).join('') + '</div><div class="result-count">共 ' + list.length + ' 条新闻</div>'
      + '<div class="notice-list">' + list.map(function (n) {
        return '<a class="notice-card" href="' + newsHref(n.id) + '"><div class="notice-top"><span class="badge ' + C.categoryClass(n.category) + '">' + escapeHtml(n.category) + '</span></div>'
          + '<h3>' + escapeHtml(n.title) + '</h3><div class="notice-bottom"><span>' + icon('clock') + C.relativeTime(n.published_at) + '</span><span>' + Number(n.views || 0) + ' 次浏览</span></div></a>';
      }).join('') + '</div>';
    shell('校园新闻', 'home', content, { back: '/home' });
  }

  function renderNewsDetail(id) {
    const item = C.state.news.find(function (n) { return Number(n.id) === Number(id); });
    if (!item) {
      shell('新闻', 'home', '<div class="empty">' + icon('news') + '<h2>新闻不存在</h2><p>这条新闻可能已经被删除。</p><a class="btn btn-outline" href="#/news">返回新闻列表</a></div>', { back: '/news' });
      return;
    }
    item.views = Number(item.views || 0) + 1;
    C.save();
    const content = (item.cover_image ? '<img src="' + escapeHtml(item.cover_image) + '" alt="' + escapeHtml(item.title) + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;margin-bottom:14px">' : '')
      + '<div class="notice-detail-head"><div class="detail-badges"><span class="badge ' + C.categoryClass(item.category) + '">' + escapeHtml(item.category) + '</span></div>'
      + '<h1>' + escapeHtml(item.title) + '</h1><div class="detail-meta"><span>' + icon('clock') + C.formatDate(item.published_at, true) + '</span><span>' + icon('eye') + Number(item.views) + ' 次浏览</span></div></div>'
      + '<article class="notice-content">' + escapeHtml(item.content) + '</article>'
      + '<div class="notice-source">' + icon('shield') + '<span>内容整理自江苏省张家港中等专业学校官网，用于校园信息展示。</span></div>'
      + '<div class="detail-actions"><button class="btn btn-outline" type="button" data-copy-link>' + icon('link') + '复制链接</button></div>';
    shell('新闻详情', 'home', content, { back: '/news' });
  }

  function renderVideos(params) {
    const category = params.get('category') || '';
    let list = C.state.videos.filter(function (v) { return v.status === 'approved'; })
      .sort(function (a, b) { return C.parseDate(b.reviewed_at) - C.parseDate(a.reviewed_at); });
    if (category) list = list.filter(function (v) { return v.category === category; });
    const categories = ['', '校园活动', '技能展示', '校园风光', '学校故事'];
    const content = '<div class="page-head"><h1>校园视频</h1><p>学生拍摄，教师审核</p></div>'
      + '<div class="filter-scroll">' + categories.map(function (cat) {
        return '<a class="filter-chip ' + (category === cat ? 'active' : '') + '" href="#/videos' + (cat ? '?category=' + encodeURIComponent(cat) : '') + '">' + (cat || '全部') + '</a>';
      }).join('') + '</div>'
      + (student ? '<div class="detail-actions" style="margin:12px 0"><a class="btn btn-primary btn-block" href="#/upload">' + icon('upload') + '投稿校园视频</a></div>' : '')
      + '<div class="video-page-grid">' + list.map(function (v) {
        return '<article class="video-item"><a class="video-item-cover" href="' + videoHref(v.id) + '">'
          + coverImage(v, v.title, 'assets/images/brand/placeholder-video.svg')
          + '<span class="play-dot">' + icon('play') + '</span></a><div class="video-item-copy"><h2><a href="' + videoHref(v.id) + '">' + escapeHtml(v.title) + '</a></h2>'
          + '<p>' + escapeHtml(v.description) + '</p><div class="video-meta-row"><span>' + escapeHtml(v.category) + ' · ' + escapeHtml(v.uploader_name) + '</span><span>' + Number(v.views || 0) + ' 次播放</span></div></div></article>';
      }).join('') + '</div>';
    shell('校园视频', 'videos', content, { back: '/home' });
  }

  function renderVideoDetail(id) {
    const video = C.state.videos.find(function (v) { return Number(v.id) === Number(id) && v.status === 'approved'; });
    if (!video) {
      shell('视频', 'videos', '<div class="empty">' + icon('play') + '<h2>视频暂不可播放</h2><p>该视频可能尚未通过审核或已被下架。</p><a class="btn btn-outline" href="#/videos">返回视频列表</a></div>', { back: '/videos' });
      return;
    }
    video.views = Number(video.views || 0) + 1;
    C.save();
    const isLocal = !!video.video_key;
    const media = isLocal
      ? '<video controls autoplay playsinline preload="metadata" data-video-key="' + escapeHtml(video.video_key) + '"' + (video.cover_key ? ' data-poster-key="' + escapeHtml(video.cover_key) + '"' : '') + '></video>'
      : '<video controls autoplay playsinline preload="metadata" poster="' + escapeHtml(video.cover_image || '') + '"><source src="' + escapeHtml(video.video_path) + '" type="video/mp4">你的浏览器不支持视频播放。</video>';
    const content = '<div class="play-page-player">' + media + '</div><div class="play-page-info"><h1>' + escapeHtml(video.title) + '</h1>'
      + '<div class="detail-meta"><span>' + icon('user') + escapeHtml(video.uploader_name) + '</span><span>' + icon('eye') + Number(video.views) + ' 次播放</span><span>' + icon('clock') + C.formatDate(video.reviewed_at) + ' 发布</span></div>'
      + '<div class="play-description">' + escapeHtml(video.description) + '</div><div class="review-stamp">' + icon('check') + '已通过教师审核</div>'
      + '<div class="detail-actions"><button class="btn btn-outline" type="button" data-copy-link>' + icon('link') + '复制链接</button><a class="btn btn-soft" href="#/videos">更多视频</a></div></div>';
    shell('视频播放', 'videos', content, { back: '/videos' });
    if (isLocal) {
      C.mediaUrl(video.video_key).then(function (url) {
        const player = document.querySelector('.play-page-player video');
        if (player && url) { player.src = url; player.load(); player.play().catch(function () {}); }
      });
      if (video.cover_key) {
        C.mediaUrl(video.cover_key).then(function (url) {
          const player = document.querySelector('.play-page-player video');
          if (player && url) player.poster = url;
        });
      }
    }
  }

  function renderNotifications() {
    if (!student) {
      shell('通知', 'profile', '<div class="empty">' + icon('bell') + '<h2>登录后查看通知</h2><p>登录学生账号，接收你所在系部和全校的重要通知。</p><a class="btn btn-primary" href="#/login?next=/notifications">学生登录</a></div>', { back: '/home' });
      return;
    }
    const unread = new Set(C.unreadNotices(student).map(function (n) { return n.id; }));
    const list = C.visibleNotices(student);
    C.markAllNoticesRead(student);
    const content = '<div class="page-head"><h1>通知</h1><p>全校通知与你所在系部的安排</p></div>'
      + (list.length ? '<div class="notification-list">' + list.map(function (n) {
        return '<a class="notification-item ' + (unread.has(n.id) ? 'unread' : '') + '" href="' + noticeHref(n.id, 'notifications') + '"><span class="notification-dot"></span>'
          + '<span class="notification-copy"><strong>' + escapeHtml(n.title) + '</strong><p>' + escapeHtml(n.summary) + '</p><span>' + escapeHtml(C.scopeText(n)) + ' · ' + C.relativeTime(n.published_at) + '</span></span></a>';
      }).join('') + '</div>' : '<div class="empty">' + icon('bell') + '<h2>暂无通知</h2><p>有新的校园信息时会显示在这里。</p></div>');
    shell('通知', 'profile', content, { back: '/home' });
  }

  function renderProfile() {
    if (!student) {
      const content = '<div class="login-wrap"><div class="login-seal">匠</div><h1>登录校园信息港</h1><p class="lead">登录后可以接收系部通知、查看我的投稿，并使用校园问答。</p>'
        + '<form class="login-form-block" data-form="login"><input type="hidden" name="next" value="/profile">'
        + '<div class="field"><label for="loginUser">账号</label><input id="loginUser" name="username" autocomplete="username" required placeholder="请输入学生账号"></div>'
        + '<div class="field"><label for="loginPass">密码</label><input id="loginPass" name="password" type="password" autocomplete="current-password" required placeholder="请输入密码"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">登录</button><div class="demo-bar"><button type="button" data-demo="student">使用学生演示账号</button><button type="button" data-demo="student2">机械系演示账号</button></div>'
        + '<p class="login-alt"><a href="#/register">注册学生账号</a> · <a href="#/welcome">返回引导页</a></p></form>'
        + '<div class="source-foot">江苏省张家港中等专业学校 · 校园信息港<br><a href="https://zjgzzx.zjgedu.cn/" target="_blank" rel="noopener">内容来源：学校官网</a></div></div>';
      shell('我的', 'profile', content, { back: '/home' });
      return;
    }
    const mine = C.state.videos.filter(function (v) { return Number(v.uploader_id) === Number(student.id); });
    const pending = mine.filter(function (v) { return v.status === 'pending'; }).length;
    const approved = mine.filter(function (v) { return v.status === 'approved'; }).length;
    const content = '<div class="profile-card"><div class="profile-user"><div class="profile-avatar">' + escapeHtml(student.real_name.slice(0, 1)) + '</div>'
      + '<div><h2>' + escapeHtml(student.real_name) + '</h2><p>' + escapeHtml(C.departmentName(student.department)) + ' · ' + escapeHtml(student.title || '学生') + '</p></div></div>'
      + '<div class="profile-notice">' + icon('shield') + '已开启校园通知，重要信息会第一时间提醒</div></div>'
      + '<div class="menu-group"><a class="menu-link" href="#/my">' + icon('play') + '我的投稿<span class="menu-value">' + pending + ' 待审 / ' + approved + ' 已通过</span>' + icon('arrow', 'menu-arrow') + '</a>'
      + '<a class="menu-link" href="#/notifications">' + icon('bell') + '我的通知' + (C.unreadNotices(student).length ? '<span class="menu-value">' + C.unreadNotices(student).length + ' 条未读</span>' : '') + icon('arrow', 'menu-arrow') + '</a>'
      + '<a class="menu-link" href="#/news">' + icon('news') + '校园新闻' + icon('arrow', 'menu-arrow') + '</a></div>'
      + '<div class="menu-group"><button class="menu-link" type="button" data-action="enable-notify">' + icon('bell') + '开启系统通知' + icon('arrow', 'menu-arrow') + '</button>'
      + '<a class="menu-link" href="teacher.html">' + icon('userGroup') + '教师端入口' + icon('arrow', 'menu-arrow') + '</a>'
      + '<button class="menu-link danger" type="button" data-action="logout">' + icon('logout') + '退出登录</button></div>'
      + '<div class="source-foot">江苏省张家港中等专业学校 · 校园信息港<br><a href="https://zjgzzx.zjgedu.cn/" target="_blank" rel="noopener">内容来源：学校官网</a></div>';
    shell('我的', 'profile', content, { back: '/home' });
  }

  function renderLogin(params) {
    const next = params.get('next') || '/home';
    const content = '<div class="login-wrap"><div class="login-seal">匠</div><h1>学生登录</h1><p class="lead">登录后接收所在系部通知，查看投稿与问答记录。</p>'
      + '<form class="login-form-block" data-form="login"><input type="hidden" name="next" value="' + escapeHtml(next) + '">'
      + '<div class="field"><label for="loginUser">账号</label><input id="loginUser" name="username" autocomplete="username" required placeholder="请输入学生账号"></div>'
      + '<div class="field"><label for="loginPass">密码</label><input id="loginPass" name="password" type="password" autocomplete="current-password" required placeholder="请输入密码"></div>'
      + '<button class="btn btn-primary btn-block" type="submit">登录</button>'
      + '<div class="demo-bar"><button type="button" data-demo="student">信息工程系演示</button><button type="button" data-demo="student2">机械汽车系演示</button></div>'
      + '<p class="login-alt">还没有账号？<a href="#/register">注册学生账号</a> · <a href="#/welcome">返回引导页</a> · <a href="teacher.html">教师端</a></p></form></div>';
    shell('学生登录', 'profile', content, { back: '/welcome', hideTab: true });
  }

  function renderRegister() {
    const content = '<div class="login-wrap"><div class="login-seal">匠</div><h1>注册学生账号</h1><p class="lead">注册后请选择你的系部，系统会发送对应系部的通知。</p>'
      + '<form class="login-form-block" data-form="register">'
      + '<div class="field"><label for="regName">姓名</label><input id="regName" name="real_name" required maxlength="20" placeholder="请输入真实姓名"></div>'
      + '<div class="field"><label for="regUser">账号</label><input id="regUser" name="username" required pattern="[A-Za-z0-9_]{3,20}" maxlength="20" placeholder="3-20位字母、数字或下划线"></div>'
      + '<div class="field"><label for="regDept">所在系部</label><select id="regDept" name="department" required><option value="">请选择系部</option>' + C.departments().map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('') + '</select></div>'
      + '<div class="field"><label for="regPass">设置密码</label><input id="regPass" name="password" type="password" required minlength="6" maxlength="32" placeholder="至少6位"></div>'
      + '<div class="field"><label for="regPass2">确认密码</label><input id="regPass2" name="password2" type="password" required minlength="6" maxlength="32" placeholder="再次输入密码"></div>'
      + '<button class="btn btn-primary btn-block" type="submit">创建账号</button>'
      + '<p class="login-alt">已有账号？<a href="#/login">返回登录</a></p></form></div>';
    shell('注册', 'profile', content, { back: '/login', hideTab: true });
  }

  function renderUpload() {
    if (!student) {
      shell('投稿', 'videos', '<div class="empty">' + icon('upload') + '<h2>请先登录</h2><p>登录学生账号后才能投稿校园视频。</p><a class="btn btn-primary" href="#/login?next=/upload">学生登录</a></div>', { back: '/videos' });
      return;
    }
    const content = '<div class="page-head"><h1>投稿视频</h1><p>原创校园内容，经教师审核后发布</p></div>'
      + '<div class="form-error" id="formErrors" hidden></div>'
      + '<form data-form="upload" class="form-page"><div class="form-block"><h2>视频信息</h2>'
      + '<div class="field"><label for="videoTitle">标题</label><input id="videoTitle" name="title" maxlength="60" required placeholder="例如：校园的一天"></div>'
      + '<div class="field"><label for="videoCategory">分类</label><select id="videoCategory" name="category" required><option value="校园活动">校园活动</option><option value="技能展示">技能展示</option><option value="校园风光">校园风光</option><option value="学校故事">学校故事</option></select></div>'
      + '<div class="field"><label for="videoDesc">简介</label><textarea id="videoDesc" name="description" maxlength="300" required placeholder="介绍视频内容"></textarea></div></div>'
      + '<div class="form-block"><h2>上传文件</h2><div class="field"><label class="file-label" for="videoFile"><span>选择视频</span><span data-file-name="video">MP4，最大200MB</span><input id="videoFile" name="video" type="file" accept=".mp4,video/mp4" required data-file="video"></label></div>'
      + '<div class="field"><label class="file-label" for="coverFile"><span>选择封面</span><span data-file-name="cover">JPG 或 PNG，最大2MB</span><input id="coverFile" name="cover" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" required data-file="cover"></label></div></div>'
      + '<div class="form-actions"><button class="btn btn-primary btn-block" type="submit">提交审核</button><p class="submit-note">提交后进入待审核状态，可在“我的投稿”查看结果。</p></div></form>';
    shell('投稿视频', 'videos', content, { back: '/videos' });
  }

  function renderMyVideos() {
    if (!student) {
      shell('我的投稿', 'profile', '<div class="empty">' + icon('play') + '<h2>请先登录</h2><p>登录后查看自己的视频投稿。</p><a class="btn btn-primary" href="#/login?next=/my">学生登录</a></div>', { back: '/profile' });
      return;
    }
    const mine = C.state.videos.filter(function (v) { return Number(v.uploader_id) === Number(student.id); })
      .sort(function (a, b) { return C.parseDate(b.created_at) - C.parseDate(a.created_at); });
    const content = '<div class="page-head"><h1>我的投稿</h1><p>共 ' + mine.length + ' 部视频</p></div>'
      + (mine.length ? '<div class="notice-list">' + mine.map(function (v) {
        const status = { pending: ['待审核', 'status-pending'], approved: ['已通过', 'status-approved'], rejected: ['已驳回', 'status-rejected'] }[v.status];
        return '<article class="submission-card"><div class="submission-head">'
          + '<span class="submission-thumb">' + coverImage(v, v.title, 'assets/images/brand/placeholder-video.svg') + '</span>'
          + '<div class="submission-copy"><h2>' + (v.status === 'approved' ? '<a href="' + videoHref(v.id) + '">' + escapeHtml(v.title) + '</a>' : escapeHtml(v.title)) + '</h2>'
          + '<p>' + escapeHtml(v.category) + ' · ' + C.formatDate(v.created_at) + '</p><span class="status-chip ' + status[1] + '">' + status[0] + '</span></div></div>'
          + (v.status === 'rejected' ? '<div class="reject-text">驳回理由：' + escapeHtml(v.reject_reason || '未填写') + '</div>' : '')
          + '</article>';
      }).join('') + '</div>' : '<div class="empty">' + icon('upload') + '<h2>还没有投稿</h2><p>记录校园里的活动、技能和故事，提交给老师审核。</p><a class="btn btn-primary" href="#/upload">投稿视频</a></div>');
    shell('我的投稿', 'profile', content, { back: '/profile' });
  }

  function renderRoute() {
    const route = currentRoute();
    student = C.currentUser('student');
    const path = route.path;
    if (!student && path !== '/welcome' && path !== '/login' && path !== '/register') {
      go('/welcome');
      return;
    }
    if (student && path === '/welcome') {
      go('/home');
      return;
    }
    if (path === '/welcome') renderWelcome();
    else if (path === '/home' || path === '/') renderHome();
    else if (path === '/notices') renderNotices(route.params);
    else if (/^\/notice\/\d+$/.test(path)) renderNotice(Number(path.split('/')[2]));
    else if (path === '/ask') renderAsk(route.params);
    else if (path === '/news') renderNewsList(route.params);
    else if (/^\/news\/\d+$/.test(path)) renderNewsDetail(Number(path.split('/')[2]));
    else if (path === '/videos') renderVideos(route.params);
    else if (/^\/video\/\d+$/.test(path)) renderVideoDetail(Number(path.split('/')[2]));
    else if (path === '/notifications') renderNotifications();
    else if (path === '/profile') renderProfile();
    else if (path === '/login') renderLogin(route.params);
    else if (path === '/register') renderRegister();
    else if (path === '/upload') renderUpload();
    else if (path === '/my') renderMyVideos();
    else shell('页面不存在', 'home', '<div class="empty">' + icon('search') + '<h2>页面没有找到</h2><p>地址可能写错了。</p><a class="btn btn-primary" href="#/home">回到首页</a></div>', { back: '/home' });
  }

  function renderWelcome() {
    document.title = '校园信息港';
    app.className = 'app-shell welcome-mode';
    app.innerHTML = '<section class="welcome-page"><div class="welcome-bridge"></div><div class="welcome-inner">'
      + '<div class="welcome-seal">匠</div><p class="welcome-school">江苏省张家港中等专业学校</p><h1>校园信息港</h1><div class="welcome-line"></div>'
      + '<p class="welcome-lead">全校通知、系部安排、校园新闻和视频，都在这里。</p>'
      + '<a class="welcome-button" href="#/login">进入校园信息港' + icon('arrow') + '</a>'
      + '<div class="welcome-features"><span>全校通知</span><span>系部信息</span><span>校园问答</span></div></div>'
      + '<div class="welcome-foot">江苏省张家港中等专业学校 · 校园信息港<br><a href="https://zjgzzx.zjgedu.cn/" target="_blank" rel="noopener">内容来源：学校官网</a> · <a href="teacher.html">教师入口</a></div></section>';
    window.scrollTo(0, 0);
  }

  function formErrors(errors) {
    const box = document.getElementById('formErrors');
    if (!box) {
      showToast(errors[0], 'error');
      return;
    }
    box.hidden = false;
    box.innerHTML = '<ul>' + errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ul>';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleLogin(form) {
    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const next = form.querySelector('[name="next"]').value || '/profile';
    if (!username || !password) return formErrors(['请输入账号和密码']);
    const result = C.login('student', username, password);
    if (!result.ok) return formErrors([result.message]);
    student = result.user;
    showToast('欢迎回来，' + result.user.real_name);
    go(next.indexOf('/') === 0 && next.indexOf('//') !== 0 ? next : '/home');
  }

  function handleRegister(form) {
    const name = form.querySelector('[name="real_name"]').value.trim();
    const username = form.querySelector('[name="username"]').value.trim();
    const department = form.querySelector('[name="department"]').value;
    const password = form.querySelector('[name="password"]').value;
    const password2 = form.querySelector('[name="password2"]').value;
    const errors = [];
    if (name.length < 2) errors.push('请填写真实姓名');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) errors.push('账号需为3-20位字母、数字或下划线');
    if (!department) errors.push('请选择所在系部');
    if (password.length < 6) errors.push('密码至少6位');
    if (password !== password2) errors.push('两次输入的密码不一致');
    if (errors.length) return formErrors(errors);
    const result = C.registerStudent({ real_name: name, username: username, department: department, password: password });
    if (!result.ok) return formErrors([result.message]);
    student = result.user;
    showToast('注册成功');
    go('/home');
  }

  async function handleUpload(form) {
    const title = form.querySelector('[name="title"]').value.trim();
    const category = form.querySelector('[name="category"]').value;
    const description = form.querySelector('[name="description"]').value.trim();
    const videoInput = form.querySelector('[name="video"]');
    const coverInput = form.querySelector('[name="cover"]');
    const video = videoInput.files[0];
    const cover = coverInput.files[0];
    const errors = [];
    if (!title) errors.push('请填写视频标题');
    if (!description) errors.push('请填写视频简介');
    if (!video) errors.push('请选择视频文件');
    if (!cover) errors.push('请选择封面图片');
    if (video && video.size > 200 * 1024 * 1024) errors.push('视频不能超过200MB');
    if (video && video.type && video.type !== 'video/mp4') errors.push('视频仅支持MP4格式');
    if (cover && cover.size > 2 * 1024 * 1024) errors.push('封面不能超过2MB');
    if (cover && cover.type && ['image/jpeg', 'image/png'].indexOf(cover.type) < 0) errors.push('封面仅支持JPG或PNG');
    if (errors.length) return formErrors(errors);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '正在提交…';
    try {
      const stamp = Date.now() + '_' + Math.random().toString(16).slice(2, 8);
      const videoKey = 'video_' + stamp;
      const coverKey = 'cover_' + stamp;
      await C.putMedia(videoKey, video);
      await C.putMedia(coverKey, cover);
      C.addVideo({ title: title, category: category, description: description, video_key: videoKey, cover_key: coverKey }, student);
      showToast('已提交，等待教师审核');
      go('/my');
    } catch (err) {
      console.warn(err);
      button.disabled = false;
      button.textContent = '提交审核';
      formErrors(['视频保存失败，请换一个较小的文件再试']);
    }
  }

  function handleAsk(form) {
    const input = form.querySelector('[name="q"]');
    const question = input.value.trim();
    if (!question) return;
    chat.push({ role: 'user', text: question });
    const result = C.askAI(question, student);
    chat.push({ role: 'bot', text: result.answer, sources: result.sources });
    renderAsk(new URLSearchParams());
  }

  function askFromQuestion(question) {
    if (!question) return;
    go('/ask', { q: question });
  }

  document.addEventListener('click', function (event) {
    const back = event.target.closest('[data-action="back"]');
    if (back) {
      const fallback = back.getAttribute('data-fallback') || '/home';
      if (history.length > 1) history.back();
      else go(fallback);
      return;
    }
    const notification = event.target.closest('[data-action="notifications"]');
    if (notification) { go('/notifications'); return; }
    const logout = event.target.closest('[data-action="logout"]');
    if (logout) {
      C.clearSession('student');
      student = null;
      showToast('已退出登录');
      go('/welcome');
      return;
    }
    const demo = event.target.closest('[data-demo]');
    if (demo) {
      const username = demo.getAttribute('data-demo');
      const form = demo.closest('form');
      if (form) {
        form.querySelector('[name="username"]').value = username;
        form.querySelector('[name="password"]').value = '123456';
      }
      return;
    }
    const question = event.target.closest('[data-question]');
    if (question) {
      askFromQuestion(question.getAttribute('data-question'));
      return;
    }
    const copy = event.target.closest('[data-copy-link]');
    if (copy) {
      navigator.clipboard && navigator.clipboard.writeText(location.href).then(function () {
        showToast('链接已复制');
      }).catch(function () {
        showToast('复制失败，请手动复制地址');
      });
      return;
    }
    const notify = event.target.closest('[data-action="enable-notify"]');
    if (notify) {
      C.requestNotification().then(function (status) {
        if (status === 'granted') showToast('系统通知已开启');
        else showToast('未获得通知权限，可在浏览器设置中开启', 'warning');
      });
      return;
    }
    const deptTab = event.target.closest('[data-dept-tab]');
    if (deptTab) {
      homeDept = deptTab.getAttribute('data-dept-tab');
      const panel = document.querySelector('.dept-section');
      const top = panel ? window.scrollY + panel.getBoundingClientRect().top - 70 : 0;
      renderHome();
      window.scrollTo(0, Math.max(0, top));
      return;
    }
    const questionLink = event.target.closest('[data-question-link]');
    if (questionLink) {
      askFromQuestion(questionLink.getAttribute('data-question-link'));
    }
  });

  document.addEventListener('change', function (event) {
    const file = event.target.closest('input[type="file"]');
    if (file) {
      const name = file.files[0] ? file.files[0].name : '';
      const target = file.closest('form').querySelector('[data-file-name="' + file.getAttribute('data-file') + '"]');
      if (target) target.textContent = name || (file.getAttribute('data-file') === 'video' ? 'MP4，最大200MB' : 'JPG 或 PNG，最大2MB');
    }
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      const dept = document.querySelector('[data-filter="dept"]').value;
      const scope = document.querySelector('[data-filter="scope"]').value;
      const route = currentRoute();
      const q = route.params.get('q') || '';
      const category = route.params.get('category') || '';
      go('/notices', { q: q, category: category, dept: dept, scope: scope });
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    const type = form.getAttribute('data-form');
    if (!type) return;
    event.preventDefault();
    if (type === 'home-ask') {
      const q = form.querySelector('[name="q"]').value.trim();
      if (q) go('/ask', { q: q });
    } else if (type === 'ask') {
      handleAsk(form);
    } else if (type === 'login') {
      handleLogin(form);
    } else if (type === 'register') {
      handleRegister(form);
    } else if (type === 'upload') {
      handleUpload(form);
    } else if (type === 'notice-search') {
      const q = form.querySelector('[name="q"]').value.trim();
      const dept = document.querySelector('[data-filter="dept"]') ? document.querySelector('[data-filter="dept"]').value : '';
      const scope = document.querySelector('[data-filter="scope"]') ? document.querySelector('[data-filter="scope"]').value : '';
      const route = currentRoute();
      go('/notices', { q: q, category: route.params.get('category') || '', dept: dept, scope: scope });
    }
  });

  C.subscribe(function (message) {
    student = C.currentUser('student');
    if (message.type === 'notice:new' && message.notice) {
      const notice = message.notice;
      if (student && (notice.scope === 'all' || notice.department === student.department)) {
        showToast('新通知：' + notice.title, notice.priority === 'urgent' ? 'warning' : 'info');
      } else if (!student && notice.scope === 'all') {
        showToast('新公告：' + notice.title, 'info');
      }
      const path = currentRoute().path;
      if (path !== '/ask' && path !== '/upload' && path !== '/login' && path !== '/register') renderRoute();
      return;
    }
    if (message.type === 'session' || message.type === 'state' || message.type === 'reads') {
      if (message.type === 'session') student = C.currentUser('student');
      const path = currentRoute().path;
      if (!['/ask', '/login', '/register', '/upload'].includes(path)) renderRoute();
    }
  });

  window.addEventListener('hashchange', renderRoute);
  if (!location.hash) location.hash = student ? '#/home' : '#/welcome';
  renderRoute();
})();
