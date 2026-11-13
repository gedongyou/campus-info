(function () {
  const C = window.KIERA.core;
  const app = document.getElementById('teacherApp');
  const toastRoot = document.getElementById('toastRoot');
  const modalRoot = document.getElementById('modalRoot');
  let teacher = C.currentUser('teacher');
  let pendingCoverKey = '';

  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    news: '<path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    play: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 9 5 3-5 3Z"/>',
    audit: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3-5.4 6.5-5.4s5.9 1.9 6.5 5.4"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M17.5 15c2.4.5 3.8 2.2 4.2 5"/>',
    logs: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
    alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17.5v.5"/>',
    logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    pin: '<path d="m9 4 6 0-1 6 3 3H7l3-3-1-6Z"/><path d="M12 13v7"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.7"/><path d="M20 4v7h-7"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';
  }

  function escapeHtml(value) {
    return C.escapeHtml(value);
  }

  function go(path, params) {
    const query = params ? new URLSearchParams(Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; }).map(function (k) { return [k, params[k]]; })).toString() : '';
    location.hash = '#' + path + (query ? '?' + query : '');
  }

  function currentRoute() {
    const raw = location.hash.replace(/^#/, '') || (teacher ? '/dashboard' : '/login');
    const parts = raw.split('?');
    return { path: parts[0] || '/dashboard', params: new URLSearchParams(parts[1] || '') };
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
    }, 3600);
  }

  function openDialog(title, body, footer, extraClass) {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog ' + (extraClass || '');
    dialog.innerHTML = '<div class="dialog-head"><h2>' + escapeHtml(title) + '</h2><button class="dialog-close" type="button">' + icon('close') + '</button></div>'
      + '<div class="dialog-body">' + body + '</div>'
      + (footer ? '<div class="dialog-foot">' + footer + '</div>' : '');
    modalRoot.appendChild(dialog);
    dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { setTimeout(function () { dialog.remove(); }, 100); });
    dialog.showModal();
    return dialog;
  }

  function confirmAction(title, message, onConfirm, confirmText) {
    const dialog = openDialog(title, '<p>' + escapeHtml(message) + '</p>', '<button class="btn" type="button" data-dialog-cancel>取消</button><button class="btn btn-danger" type="button" data-dialog-confirm>' + escapeHtml(confirmText || '确认删除') + '</button>');
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('[data-dialog-confirm]').addEventListener('click', function () {
      dialog.close();
      onConfirm();
    });
  }

  function coverImage(item, alt, fallback) {
    const placeholder = fallback || 'assets/images/brand/placeholder-news.svg';
    if (item.cover_image) return '<img src="' + escapeHtml(item.cover_image) + '" alt="' + escapeHtml(alt || '') + '">';
    if (item.cover_key) return '<img src="' + placeholder + '" data-cover-key="' + escapeHtml(item.cover_key) + '" alt="' + escapeHtml(alt || '') + '">';
    return '';
  }

  function publishedInput(value) {
    if (!value) {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    return String(value).slice(0, 16).replace(' ', 'T');
  }

  function normalizeDateTime(value) {
    return value ? value.replace('T', ' ') + ':00' : C.nowString();
  }

  function sidebar(active) {
    const pending = C.state.videos.filter(function (v) { return v.status === 'pending'; }).length;
    const items = [
      ['dashboard', '/dashboard', '工作台', 'dashboard'],
      ['notices', '/notices', '通知管理', 'bell'],
      ['news', '/news', '新闻管理', 'news'],
      ['audit', '/audit', '视频审核', 'audit', pending],
      ['videos', '/videos', '已发布视频', 'play'],
      ['users', '/users', '学生账号', 'users'],
      ['logs', '/logs', '审核记录', 'logs']
    ];
    return '<aside class="sidebar"><a class="sidebar-brand" href="#/dashboard"><span class="sidebar-seal">匠</span><span><strong>校园信息港</strong><span>教师工作台</span></span></a>'
      + '<nav class="side-nav"><p class="side-label">信息与审核</p>' + items.map(function (item) {
        return '<a class="side-link ' + (active === item[0] ? 'active' : '') + '" href="#' + item[1] + '">' + icon(item[3]) + '<span>' + item[2] + '</span>' + (item[4] ? '<span class="side-count">' + item[4] + '</span>' : '') + '</a>';
      }).join('') + '</nav>'
      + '<div class="sidebar-foot"><div class="side-user"><span class="side-user-avatar">' + escapeHtml(teacher.real_name.slice(0, 1)) + '</span><span><strong>' + escapeHtml(teacher.real_name) + '</strong><span>' + escapeHtml(teacher.title || '教师') + '</span></span></div>'
      + '<div class="sidebar-links"><a href="index.html">学生端</a><button type="button" data-action="reset-demo">重置数据</button><button type="button" data-action="logout">退出登录</button></div></div></aside>';
  }

  function topbar(page, subtitle) {
    return '<header class="teacher-topbar"><div class="page-title"><h1>' + escapeHtml(page) + '</h1><p>' + escapeHtml(subtitle) + '</p></div>'
      + '<div class="topbar-actions"><span class="topbar-time">' + C.formatDate(C.nowString()) + '</span><a class="topbar-link" href="index.html" target="_blank">' + icon('eye') + '查看学生端</a></div></header>';
  }

  function shell(active, page, subtitle, content) {
    document.title = page + ' · 教师工作台';
    app.innerHTML = '<div class="teacher-shell">' + sidebar(active) + '<div class="teacher-main">' + topbar(page, subtitle) + '<main class="teacher-content">' + content + '<footer class="teacher-footer">江苏省张家港中等专业学校 · 校园信息港教师端</footer></main></div></div>';
    C.hydrateMedia(app);
    window.scrollTo(0, 0);
  }

  function pageHead(title, subtitle, actions) {
    return '<div class="page-intro"><div><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(subtitle) + '</p></div>' + (actions ? '<div class="intro-actions">' + actions + '</div>' : '') + '</div>';
  }

  function renderLogin() {
    document.title = '教师登录 · 校园信息港';
    app.innerHTML = '<div class="login-page"><section class="login-visual"><div class="login-bridge"></div><div class="login-visual-copy"><div class="seal">匠</div><h1>校园信息港<br>教师工作台</h1><p>发布全校与系部通知，管理校园新闻，审核学生视频投稿。信息发布后，对应范围的学生会收到提醒。</p></div></section>'
      + '<section class="login-side"><div class="login-card"><div class="login-kicker">教师入口</div><h2>登录工作台</h2><p>使用教师账号进入通知发布与审核后台。</p>'
      + '<form class="login-form" data-form="teacher-login"><div class="field"><label for="teacherUser">教师账号</label><input id="teacherUser" name="username" autocomplete="username" required placeholder="请输入教师账号"></div>'
      + '<div class="field"><label for="teacherPass">密码</label><input id="teacherPass" name="password" type="password" autocomplete="current-password" required placeholder="请输入密码"></div>'
      + '<button class="btn btn-primary btn-block" type="submit">登录</button><div class="login-demo"><button type="button" data-demo="teacher">使用教师演示账号</button></div></form>'
      + '<div class="login-foot"><a href="index.html">返回学生端</a><button type="button" data-action="reset-demo">重置演示数据</button><span>仅限教师使用</span></div></div></section></div>';
  }

  function noticePriorityClass(priority) {
    return 'status-' + (priority || 'normal');
  }

  function renderDashboard() {
    const today = C.formatDate(C.nowString());
    const todayCount = C.state.notices.filter(function (n) { return String(n.published_at).slice(0, 10) === today; }).length;
    const pending = C.state.videos.filter(function (v) { return v.status === 'pending'; }).length;
    const urgent = C.state.notices.filter(function (n) { return n.priority === 'urgent'; }).slice(0, 4);
    const latest = C.state.notices.slice(0, 5);
    const deptColors = ['#1e5f93', '#2b7db6', '#3d7099', '#4f86a8', '#326b98'];
    const maxDept = Math.max.apply(null, C.departments().map(function (d) {
      return C.state.notices.filter(function (n) { return n.department === d.id; }).length;
    }).concat(1));
    const stats = '<div class="stats-grid">'
      + '<div class="stat-card"><div class="stat-label">通知总数</div><p class="stat-value">' + C.state.notices.length + '</p><div class="stat-foot">覆盖全校与各系部</div></div>'
      + '<div class="stat-card"><div class="stat-label">今日新增</div><p class="stat-value">' + todayCount + '</p><div class="stat-foot">' + today + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">待审核视频</div><p class="stat-value">' + pending + '</p><div class="stat-foot">学生投稿待处理</div></div>'
      + '<div class="stat-card"><div class="stat-label">紧急通知</div><p class="stat-value">' + C.state.notices.filter(function (n) { return n.priority === 'urgent'; }).length + '</p><div class="stat-foot">建议优先确认</div></div></div>';
    const urgentPanel = '<section class="panel"><div class="panel-head"><h3>需要关注</h3><a href="#/notices">通知管理</a></div><div class="panel-body no-pad"><div class="urgent-list">'
      + (urgent.length ? urgent.map(function (n) {
        return '<a class="urgent-line" href="#/notice/edit/' + n.id + '"><span class="urgent-mark">' + icon('alert') + '</span><span class="urgent-line-copy"><strong>' + escapeHtml(n.title) + '</strong><span>' + escapeHtml(C.scopeText(n)) + ' · ' + C.formatDate(n.published_at, true) + '</span></span></a>';
      }).join('') : '<div class="empty">' + icon('check') + '<p>当前没有紧急通知</p></div>') + '</div></div></section>';
    const deptPanel = '<section class="panel"><div class="panel-head"><h3>系部通知分布</h3><a href="#/notices">查看</a></div><div class="panel-body"><div class="dept-summary">'
      + C.departments().map(function (d, index) {
        const count = C.state.notices.filter(function (n) { return n.department === d.id; }).length;
        const color = deptColors[index % deptColors.length];
        return '<div class="dept-summary-row"><span class="dept-summary-dot" style="--dept-color:' + color + '"></span><span class="dept-summary-name">' + escapeHtml(d.name) + '</span><span class="dept-summary-bar"><i style="width:' + Math.max(8, Math.round(count / maxDept * 100)) + '%;--dept-color:' + color + '"></i></span><span class="dept-summary-count">' + count + '</span></div>';
      }).join('') + '</div></div></section>';
    const latestPanel = '<section class="panel"><div class="panel-head"><h3>最新发布</h3><a href="#/notices">全部通知</a></div><div class="panel-body no-pad"><table class="data-table"><thead><tr><th>标题</th><th>范围</th><th>时间</th></tr></thead><tbody>'
      + latest.map(function (n) {
        return '<tr><td><a class="table-title" href="#/notice/edit/' + n.id + '">' + escapeHtml(n.title) + '</a><span class="table-sub">' + escapeHtml(n.category) + ' · ' + escapeHtml(n.publisher_name) + '</span></td><td><span class="badge-scope">' + escapeHtml(C.scopeText(n)) + '</span></td><td>' + C.formatDate(n.published_at) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    const actionsPanel = '<section class="panel"><div class="panel-head"><h3>快捷操作</h3></div><div class="panel-body"><div class="quick-actions">'
      + '<a class="quick-action" href="#/notice/new">' + icon('plus') + '发布新通知</a><a class="quick-action" href="#/audit">' + icon('audit') + '审核视频</a>'
      + '<a class="quick-action" href="#/news/new">' + icon('news') + '发布校园新闻</a><a class="quick-action" href="#/users">' + icon('users') + '查看学生账号</a></div></div></section>';
    const content = pageHead('工作台', '通知发布、内容审核与系部信息管理', '<a class="btn btn-primary" href="#/notice/new">' + icon('plus') + '发布通知</a>')
      + stats + '<div class="dashboard-grid"><div style="display:flex;flex-direction:column;gap:15px">' + urgentPanel + latestPanel + '</div><div style="display:flex;flex-direction:column;gap:15px">' + deptPanel + actionsPanel + '</div></div>';
    shell('dashboard', '工作台', '通知发布、内容审核与系部信息管理', content);
  }

  function renderNotices(params) {
    const q = (params.get('q') || '').trim().toLowerCase();
    const scope = params.get('scope') || '';
    const deptId = params.get('dept') || '';
    const category = params.get('category') || '';
    let list = C.state.notices.slice().sort(function (a, b) {
      if (Number(b.is_pinned) !== Number(a.is_pinned)) return Number(b.is_pinned) - Number(a.is_pinned);
      return C.parseDate(b.published_at) - C.parseDate(a.published_at);
    });
    if (q) list = list.filter(function (n) { return (n.title + n.summary + n.content).toLowerCase().indexOf(q) >= 0; });
    if (scope) list = list.filter(function (n) { return n.scope === scope; });
    if (deptId) list = list.filter(function (n) { return n.department === deptId; });
    if (category) list = list.filter(function (n) { return n.category === category; });
    const rows = list.map(function (n) {
      return '<tr><td><a class="table-title" href="#/notice/edit/' + n.id + '">' + (Number(n.is_pinned) ? icon('pin') + ' ' : '') + escapeHtml(n.title) + '</a><span class="table-sub">' + escapeHtml(n.summary) + '</span></td>'
        + '<td><span class="badge-scope">' + escapeHtml(C.scopeText(n)) + '</span></td><td>' + escapeHtml(n.category) + '</td><td><span class="status ' + noticePriorityClass(n.priority) + '">' + C.priorityText(n.priority) + '</span></td>'
        + '<td>' + C.formatDate(n.published_at, true) + '</td><td><div class="table-actions"><a class="btn btn-sm" href="#/notice/edit/' + n.id + '">' + icon('edit') + '编辑</a><button class="btn btn-sm btn-danger" type="button" data-delete-notice="' + n.id + '">' + icon('trash') + '删除</button></div></td></tr>';
    }).join('');
    const content = pageHead('通知管理', '全校总览通知与各系部分支通知', '<a class="btn btn-primary" href="#/notice/new">' + icon('plus') + '发布通知</a>')
      + '<form class="notice-toolbar" data-form="notice-filter"><div class="toolbar-filters">'
      + '<div class="mini-field"><label>关键词</label><input name="q" value="' + escapeHtml(q) + '" placeholder="搜索标题或内容"></div>'
      + '<div class="mini-field"><label>发布范围</label><select name="scope"><option value="">全部</option><option value="all"' + (scope === 'all' ? ' selected' : '') + '>全校</option><option value="dept"' + (scope === 'dept' ? ' selected' : '') + '>系部</option></select></div>'
      + '<div class="mini-field"><label>系部</label><select name="dept"><option value="">全部</option>' + C.departments().map(function (d) { return '<option value="' + d.id + '"' + (deptId === d.id ? ' selected' : '') + '>' + d.name + '</option>'; }).join('') + '</select></div>'
      + '<div class="mini-field"><label>分类</label><select name="category"><option value="">全部</option>' + C.categories().map(function (c) { return '<option value="' + c + '"' + (category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '</div><div class="toolbar-actions"><button class="btn btn-primary" type="submit">' + icon('search') + '筛选</button><a class="btn" href="#/notices">重置</a></div></form>'
      + '<section class="panel"><div class="panel-head"><h3>共 ' + list.length + ' 条通知</h3><span class="table-sub">置顶通知会优先显示</span></div><div class="panel-body no-pad table-wrap"><table class="data-table"><thead><tr><th>通知标题</th><th>范围</th><th>分类</th><th>优先级</th><th>发布时间</th><th>操作</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="6"><div class="empty">' + icon('bell') + '<h3>没有符合条件的通知</h3><p>调整筛选条件后再查看。</p></div></td></tr>') + '</tbody></table></div></section>';
    shell('notices', '通知管理', '全校总览通知与各系部分支通知', content);
  }

  function renderNoticeForm(id) {
    const isEdit = !!id;
    const notice = isEdit ? C.noticeById(id) : null;
    if (isEdit && !notice) {
      shell('notices', '通知管理', '通知不存在', '<div class="empty">' + icon('alert') + '<h3>找不到这条通知</h3><p>它可能已经被删除。</p><a class="btn btn-primary" href="#/notices">返回通知列表</a></div>');
      return;
    }
    const scope = notice ? notice.scope : 'all';
    const dept = notice ? notice.department : '';
    const content = pageHead(isEdit ? '编辑通知' : '发布通知', '选择全校或单个系部，发布后学生端会收到提醒', '<a class="btn" href="#/notices">返回列表</a>')
      + '<div class="form-error" id="formErrors" hidden></div>'
      + '<form class="form-layout" data-form="notice" data-id="' + (notice ? notice.id : '') + '"><div class="form-panel"><h3>通知内容</h3>'
      + '<div class="field"><label for="noticeTitle">标题</label><input id="noticeTitle" name="title" maxlength="80" required value="' + escapeHtml(notice ? notice.title : '') + '" placeholder="例如：通学路施工期间出行提醒"></div>'
      + '<div class="field"><label for="noticeSummary">摘要</label><input id="noticeSummary" name="summary" maxlength="120" required value="' + escapeHtml(notice ? notice.summary : '') + '" placeholder="一句话说明通知重点"></div>'
      + '<div class="field"><label for="noticeContent">正文</label><textarea id="noticeContent" name="content" required placeholder="写清楚时间、地点、对象和注意事项">' + escapeHtml(notice ? notice.content : '') + '</textarea></div>'
      + '<div class="field-row"><div class="field"><label for="noticeCategory">分类</label><select id="noticeCategory" name="category">' + C.categories().map(function (c) { return '<option' + (notice && notice.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '<div class="field"><label for="noticePriority">优先级</label><select id="noticePriority" name="priority"><option value="normal"' + (notice && notice.priority === 'normal' ? ' selected' : '') + '>普通</option><option value="important"' + (notice && notice.priority === 'important' ? ' selected' : '') + '>重要</option><option value="urgent"' + (notice && notice.priority === 'urgent' ? ' selected' : '') + '>紧急</option></select></div></div>'
      + '<div class="field"><label for="noticePublished">发布时间</label><input id="noticePublished" name="published_at" type="datetime-local" value="' + publishedInput(notice ? notice.published_at : '') + '"><div class="form-help">保持当前时间可立即发布；学生端按发布时间排序。</div></div></div>'
      + '<div><div class="form-panel" style="margin-bottom:14px"><h3>发布范围</h3><div class="scope-options">'
      + '<label class="radio-card"><input type="radio" name="scope" value="all"' + (scope === 'all' ? ' checked' : '') + '><span><strong>全校总览</strong><span>所有学生都能收到</span></span></label>'
      + '<label class="radio-card"><input type="radio" name="scope" value="dept"' + (scope === 'dept' ? ' checked' : '') + '><span><strong>指定系部</strong><span>只通知该系部学生</span></span></label></div>'
      + '<div class="field" id="deptSelectWrap" style="margin-top:12px;' + (scope === 'dept' ? '' : 'display:none') + '"><label for="noticeDept">选择系部</label><select id="noticeDept" name="department"><option value="">请选择系部</option>' + C.departments().map(function (d) { return '<option value="' + d.id + '"' + (dept === d.id ? ' selected' : '') + '>' + d.name + '</option>'; }).join('') + '</select></div>'
      + '<div class="field"><label class="check-line"><input type="checkbox" name="is_pinned"' + (notice && Number(notice.is_pinned) ? ' checked' : '') + '>置顶显示</label></div></div>'
      + '<div class="side-note"><h4>发布说明</h4><p>全校通知面向所有学生；指定系部通知只推送给该系部学生，但可以在学生端系部导航中查看。</p><p>发布后会立即写入学生端通知列表，并在同一浏览器的学生页面弹出提醒。</p></div>'
      + '<div class="form-actions"><a class="btn" href="#/notices">取消</a><button class="btn btn-primary" type="submit">' + (isEdit ? '保存修改' : '发布并通知') + '</button></div></div></form>';
    shell('notices', isEdit ? '编辑通知' : '发布通知', '选择全校或单个系部，发布后学生端会收到提醒', content);
  }

  function renderNews(params) {
    const category = params.get('category') || '';
    let list = C.state.news.slice().sort(function (a, b) { return C.parseDate(b.published_at) - C.parseDate(a.published_at); });
    if (category) list = list.filter(function (n) { return n.category === category; });
    const rows = list.map(function (n) {
      return '<tr><td><div style="display:flex;align-items:center;gap:10px"><span style="width:72px;height:44px;overflow:hidden;background:#eee8dd;flex:0 0 auto">' + (n.cover_image || n.cover_key ? coverImage(n, n.title) : '') + '</span><span><a class="table-title" href="#/news/edit/' + n.id + '">' + escapeHtml(n.title) + '</a><span class="table-sub">' + escapeHtml(n.category) + ' · ' + Number(n.views || 0) + ' 次阅读</span></span></div></td><td>' + C.formatDate(n.published_at) + '</td><td>' + escapeHtml(n.creator_name || '') + '</td><td><div class="table-actions"><a class="btn btn-sm" href="#/news/edit/' + n.id + '">' + icon('edit') + '编辑</a><button class="btn btn-sm btn-danger" type="button" data-delete-news="' + n.id + '">' + icon('trash') + '删除</button></div></td></tr>';
    }).join('');
    const content = pageHead('新闻管理', '学校新闻与校园动态', '<a class="btn btn-primary" href="#/news/new">' + icon('plus') + '发布新闻</a>')
      + '<div class="notice-toolbar"><div class="toolbar-filters"><div class="mini-field"><label>分类</label><select data-news-category><option value="">全部</option>' + ['竞赛获奖', '校园活动', '通知公告', '学校故事'].map(function (c) { return '<option' + (category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div></div><div class="toolbar-actions"><a class="btn" href="#/news">重置</a></div></div>'
      + '<section class="panel"><div class="panel-head"><h3>共 ' + list.length + ' 条新闻</h3><span class="table-sub">新闻封面支持上传</span></div><div class="panel-body no-pad table-wrap"><table class="data-table"><thead><tr><th>新闻</th><th>发布时间</th><th>发布人</th><th>操作</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="4"><div class="empty">' + icon('news') + '<h3>暂无新闻</h3><p>发布第一条校园新闻。</p></div></td></tr>') + '</tbody></table></div></section>';
    shell('news', '新闻管理', '学校新闻与校园动态', content);
  }

  function renderNewsForm(id) {
    const isEdit = !!id;
    const item = isEdit ? C.state.news.find(function (n) { return Number(n.id) === Number(id); }) : null;
    if (isEdit && !item) {
      shell('news', '新闻管理', '新闻不存在', '<div class="empty">' + icon('alert') + '<h3>找不到这条新闻</h3><p>它可能已经被删除。</p><a class="btn btn-primary" href="#/news">返回新闻列表</a></div>');
      return;
    }
    const categories = ['竞赛获奖', '校园活动', '通知公告', '学校故事'];
    const content = pageHead(isEdit ? '编辑新闻' : '发布新闻', '发布学校新闻与校园动态', '<a class="btn" href="#/news">返回列表</a>')
      + '<div class="form-error" id="formErrors" hidden></div>'
      + '<form class="form-layout" data-form="news" data-id="' + (item ? item.id : '') + '"><div class="form-panel"><h3>新闻内容</h3>'
      + '<div class="field"><label for="newsTitle">标题</label><input id="newsTitle" name="title" maxlength="100" required value="' + escapeHtml(item ? item.title : '') + '"></div>'
      + '<div class="field-row"><div class="field"><label for="newsCategory">分类</label><select id="newsCategory" name="category">' + categories.map(function (c) { return '<option' + (item && item.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '<div class="field"><label for="newsPublished">发布时间</label><input id="newsPublished" name="published_at" type="datetime-local" value="' + publishedInput(item ? item.published_at : '') + '"></div></div>'
      + '<div class="field"><label for="newsSummary">摘要</label><input id="newsSummary" name="summary" maxlength="180" required value="' + escapeHtml(item ? item.summary : '') + '"></div>'
      + '<div class="field"><label for="newsContent">正文</label><textarea id="newsContent" name="content" required>' + escapeHtml(item ? item.content : '') + '</textarea></div></div>'
      + '<div><div class="form-panel" style="margin-bottom:14px"><h3>封面</h3>'
      + '<div class="field">' + (item && (item.cover_image || item.cover_key) ? '<div class="preview-cover" id="coverPreview">' + coverImage(item, item.title) + '</div>' : '<div class="preview-cover" id="coverPreview"></div>') + '</div>'
      + '<div class="field"><label class="file-row" for="newsCover"><span><strong>选择封面图片</strong><br>JPG 或 PNG，建议比例 16:9</span><input id="newsCover" name="cover" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png"></label><div class="form-help">不上传则保留原封面；新新闻可暂不设置封面。</div></div>'
      + '<div class="field"><label class="check-line"><input type="checkbox" name="is_home"' + (item && Number(item.is_home) ? ' checked' : '') + '>在首页推荐</label></div></div>'
      + '<div class="side-note"><h4>内容规范</h4><p>新闻内容需与学校官网或校内活动一致，图片使用需确认来源。学生端只展示已发布内容。</p></div>'
      + '<div class="form-actions"><a class="btn" href="#/news">取消</a><button class="btn btn-primary" type="submit">' + (isEdit ? '保存修改' : '发布新闻') + '</button></div></div></form>';
    pendingCoverKey = '';
    shell('news', isEdit ? '编辑新闻' : '发布新闻', '发布学校新闻与校园动态', content);
  }

  function renderAudit() {
    const pending = C.state.videos.filter(function (v) { return v.status === 'pending'; }).sort(function (a, b) { return C.parseDate(b.created_at) - C.parseDate(a.created_at); });
    const content = pageHead('视频审核', '学生投稿需要审核后才能公开', '<a class="btn" href="#/videos">已发布视频</a>')
      + (pending.length ? '<div class="audit-grid">' + pending.map(function (v) {
        return '<article class="audit-card"><button class="audit-cover" type="button" data-preview-video="' + v.id + '">'
          + coverImage(v, v.title, 'assets/images/brand/placeholder-video.svg') + '<span class="play-dot">' + icon('play') + '</span></button>'
          + '<div class="audit-copy"><h3>' + escapeHtml(v.title) + '</h3><p>' + escapeHtml(v.description) + '</p>'
          + '<div class="audit-meta"><span>' + escapeHtml(v.uploader_name) + ' · ' + escapeHtml(v.category) + '</span><span>' + C.relativeTime(v.created_at) + '</span></div>'
          + '<div class="audit-actions"><button class="btn btn-brass" type="button" data-approve="' + v.id + '">' + icon('check') + '通过</button><button class="btn btn-danger" type="button" data-reject="' + v.id + '">' + icon('close') + '驳回</button></div></div></article>';
      }).join('') + '</div>' : '<div class="empty">' + icon('check') + '<h3>暂无待审核视频</h3><p>学生提交投稿后会在这里显示。</p></div>');
    shell('audit', '视频审核', '学生投稿需要审核后才能公开', content);
  }

  function renderVideos() {
    const list = C.state.videos.slice().sort(function (a, b) { return C.parseDate(b.created_at) - C.parseDate(a.created_at); });
    const rows = list.map(function (v) {
      const status = { approved: ['已发布', 'status-approved'], pending: ['待审核', 'status-pending'], rejected: ['已驳回', 'status-rejected'] }[v.status];
      return '<tr><td><a class="table-title" href="#/video/' + v.id + '" target="_blank">' + escapeHtml(v.title) + '</a><span class="table-sub">' + escapeHtml(v.category) + ' · ' + escapeHtml(v.uploader_name) + '</span></td><td><span class="status ' + status[1] + '">' + status[0] + '</span></td><td>' + Number(v.views || 0) + '</td><td>' + C.formatDate(v.created_at) + '</td><td><div class="table-actions"><button class="btn btn-sm" type="button" data-preview-video="' + v.id + '">' + icon('play') + '预览</button>' + (v.status === 'pending' ? '<a class="btn btn-sm" href="#/audit">去审核</a>' : '') + '<button class="btn btn-sm btn-danger" type="button" data-delete-video="' + v.id + '">' + icon('trash') + '删除</button></div></td></tr>';
    }).join('');
    const content = pageHead('已发布视频', '所有学生投稿与审核状态', '<a class="btn btn-primary" href="#/audit">' + icon('audit') + '待审核 ' + C.state.videos.filter(function (v) { return v.status === 'pending'; }).length + '</a>')
      + '<section class="panel"><div class="panel-head"><h3>共 ' + list.length + ' 个视频</h3><span class="table-sub">已发布内容可在学生端查看</span></div><div class="panel-body no-pad table-wrap"><table class="data-table"><thead><tr><th>视频</th><th>状态</th><th>播放</th><th>投稿时间</th><th>操作</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="5"><div class="empty">' + icon('play') + '<h3>暂无视频</h3><p>学生投稿后会显示在这里。</p></div></td></tr>') + '</tbody></table></div></section>';
    shell('videos', '已发布视频', '所有学生投稿与审核状态', content);
  }

  function renderUsers() {
    const students = C.state.users.filter(function (u) { return u.role === 'student'; });
    const rows = students.map(function (u) {
      return '<tr><td><span class="user-avatar">' + escapeHtml(u.real_name.slice(0, 1)) + '</span><span style="font-weight:600;color:#343730">' + escapeHtml(u.real_name) + '</span><span class="table-sub">' + escapeHtml(u.username) + '</span></td>'
        + '<td>' + escapeHtml(C.departmentName(u.department)) + '</td><td>' + escapeHtml(u.title || '学生') + '</td><td><span class="status ' + (Number(u.status) === 1 ? 'status-approved' : 'status-rejected') + '">' + (Number(u.status) === 1 ? '正常' : '已禁用') + '</span></td>'
        + '<td><button class="btn btn-sm ' + (Number(u.status) === 1 ? 'btn-danger' : 'btn-outline') + '" type="button" data-toggle-user="' + u.id + '">' + (Number(u.status) === 1 ? '禁用' : '恢复') + '</button></td></tr>';
    }).join('');
    const content = pageHead('学生账号', '查看学生所属系部与账号状态', '')
      + '<section class="panel"><div class="panel-head"><h3>共 ' + students.length + ' 个学生账号</h3><span class="table-sub">禁用后无法登录学生端</span></div><div class="panel-body no-pad table-wrap"><table class="data-table"><thead><tr><th>学生</th><th>系部</th><th>班级</th><th>状态</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
    shell('users', '学生账号', '查看学生所属系部与账号状态', content);
  }

  function renderLogs() {
    const logs = C.state.audit_logs.slice().sort(function (a, b) { return C.parseDate(b.created_at) - C.parseDate(a.created_at); });
    const rows = logs.map(function (l) {
      return '<tr><td><span class="table-title">' + escapeHtml(l.video_title) + '</span><span class="table-sub">视频编号 ' + l.video_id + '</span></td><td>' + escapeHtml(l.reviewer_name) + '</td><td><span class="status ' + (l.result === 'approved' ? 'status-approved' : 'status-rejected') + '">' + (l.result === 'approved' ? '通过' : '驳回') + '</span></td><td>' + escapeHtml(l.reason || '') + '</td><td>' + C.formatDate(l.created_at, true) + '</td></tr>';
    }).join('');
    const content = pageHead('审核记录', '视频审核操作留痕', '')
      + '<section class="panel"><div class="panel-head"><h3>共 ' + logs.length + ' 条记录</h3></div><div class="panel-body no-pad table-wrap"><table class="data-table"><thead><tr><th>视频</th><th>审核人</th><th>结果</th><th>审核意见</th><th>时间</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5"><div class="empty">' + icon('logs') + '<h3>暂无审核记录</h3></div></td></tr>') + '</tbody></table></div></section>';
    shell('logs', '审核记录', '视频审核操作留痕', content);
  }

  function handleLogin(form) {
    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const result = C.login('teacher', username, password);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    teacher = result.user;
    showToast('欢迎回来，' + result.user.real_name);
    go('/dashboard');
  }

  function handleNotice(form) {
    const id = Number(form.getAttribute('data-id')) || 0;
    const scope = form.querySelector('[name="scope"]:checked').value;
    const data = {
      title: form.querySelector('[name="title"]').value.trim(),
      summary: form.querySelector('[name="summary"]').value.trim(),
      content: form.querySelector('[name="content"]').value.trim(),
      category: form.querySelector('[name="category"]').value,
      priority: form.querySelector('[name="priority"]').value,
      scope: scope,
      department: form.querySelector('[name="department"]').value,
      is_pinned: form.querySelector('[name="is_pinned"]').checked,
      published_at: normalizeDateTime(form.querySelector('[name="published_at"]').value)
    };
    const errors = [];
    if (!data.title) errors.push('请填写通知标题');
    if (!data.summary) errors.push('请填写通知摘要');
    if (!data.content) errors.push('请填写通知正文');
    if (scope === 'dept' && !data.department) errors.push('请选择发布系部');
    if (errors.length) {
      const box = document.getElementById('formErrors');
      box.hidden = false;
      box.innerHTML = '<ul>' + errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ul>';
      return;
    }
    if (id) {
      C.updateNotice(id, data);
      showToast('通知已更新');
    } else {
      C.addNotice(data, teacher);
      showToast('通知已发布，学生端会收到提醒');
    }
    go('/notices');
  }

  async function handleNews(form) {
    const id = Number(form.getAttribute('data-id')) || 0;
    const file = form.querySelector('[name="cover"]').files[0];
    const data = {
      title: form.querySelector('[name="title"]').value.trim(),
      category: form.querySelector('[name="category"]').value,
      summary: form.querySelector('[name="summary"]').value.trim(),
      content: form.querySelector('[name="content"]').value.trim(),
      published_at: normalizeDateTime(form.querySelector('[name="published_at"]').value),
      is_home: form.querySelector('[name="is_home"]').checked ? 1 : 0
    };
    if (!data.title || !data.summary || !data.content) {
      showToast('请填写完整新闻内容', 'error');
      return;
    }
    if (file) {
      if (file.size > 2 * 1024 * 1024) { showToast('封面不能超过2MB', 'error'); return; }
      if (['image/jpeg', 'image/png'].indexOf(file.type) < 0) { showToast('封面仅支持JPG或PNG', 'error'); return; }
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (file) {
        const key = 'news_cover_' + Date.now();
        await C.putMedia(key, file);
        data.cover_key = key;
      }
      if (id) {
        C.updateNews(id, data);
        showToast('新闻已更新');
      } else {
        C.addNews(data, teacher);
        showToast('新闻已发布');
      }
      go('/news');
    } catch (err) {
      console.warn(err);
      button.disabled = false;
      showToast('保存失败，请重试', 'error');
    }
  }

  function openVideoPreview(id) {
    const video = C.state.videos.find(function (v) { return Number(v.id) === Number(id); });
    if (!video) return;
    const isLocal = !!video.video_key;
    const media = isLocal
      ? '<video controls autoplay playsinline data-preview-key="' + escapeHtml(video.video_key) + '"' + (video.cover_key ? ' data-preview-poster="' + escapeHtml(video.cover_key) + '"' : '') + '></video>'
      : '<video controls autoplay playsinline poster="' + escapeHtml(video.cover_image || '') + '"><source src="' + escapeHtml(video.video_path) + '" type="video/mp4"></video>';
    const dialog = openDialog(video.title, media + '<p style="margin-top:10px">' + escapeHtml(video.description) + '</p><p>' + escapeHtml(video.uploader_name) + ' · ' + escapeHtml(video.category) + '</p>', '', 'dialog-video');
    const player = dialog.querySelector('video');
    if (player) player.play().catch(function () {});
    if (isLocal) {
      C.mediaUrl(video.video_key).then(function (url) {
        const player = dialog.querySelector('video');
        if (player && url) { player.src = url; player.load(); player.play().catch(function () {}); }
      });
      if (video.cover_key) {
        C.mediaUrl(video.cover_key).then(function (url) {
          const player = dialog.querySelector('video');
          if (player && url) player.poster = url;
        });
      }
    }
  }

  function openReject(id) {
    const video = C.state.videos.find(function (v) { return Number(v.id) === Number(id); });
    if (!video) return;
    const dialog = openDialog('驳回视频', '<p>请填写驳回原因，学生会在“我的投稿”中看到。</p><textarea class="reject-reason" data-reject-reason placeholder="例如：画面中出现未授权的清晰人脸，请处理后重新提交。"></textarea>',
      '<button class="btn" type="button" data-dialog-cancel>取消</button><button class="btn btn-danger" type="button" data-confirm-reject>确认驳回</button>');
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('[data-confirm-reject]').addEventListener('click', function () {
      const reason = dialog.querySelector('[data-reject-reason]').value.trim();
      if (!reason) { showToast('请填写驳回原因', 'error'); return; }
      C.reviewVideo(id, 'rejected', reason, teacher);
      dialog.close();
      showToast('已驳回该视频');
      renderRoute();
    });
  }

  function renderRoute() {
    const route = currentRoute();
    teacher = C.currentUser('teacher');
    if (!teacher) {
      if (route.path !== '/login') go('/login');
      else renderLogin();
      return;
    }
    if (route.path === '/login') {
      go('/dashboard');
      return;
    }
    const path = route.path;
    if (path === '/dashboard' || path === '/') renderDashboard();
    else if (path === '/notices') renderNotices(route.params);
    else if (path === '/notice/new') renderNoticeForm(0);
    else if (/^\/notice\/edit\/\d+$/.test(path)) renderNoticeForm(Number(path.split('/')[3]));
    else if (path === '/news') renderNews(route.params);
    else if (path === '/news/new') renderNewsForm(0);
    else if (/^\/news\/edit\/\d+$/.test(path)) renderNewsForm(Number(path.split('/')[3]));
    else if (path === '/audit') renderAudit();
    else if (path === '/videos') renderVideos();
    else if (path === '/users') renderUsers();
    else if (path === '/logs') renderLogs();
    else go('/dashboard');
  }

  document.addEventListener('click', function (event) {
    const resetDemo = event.target.closest('[data-action="reset-demo"]');
    if (resetDemo) {
      confirmAction('重置演示数据', '将清除当前浏览器里的通知、新闻、视频、账号状态和上传文件，并恢复到初始演示数据。确定继续吗？', function () {
        C.reset();
        teacher = null;
        location.hash = '#/login';
        setTimeout(function () { location.reload(); }, 500);
      }, '确认重置');
      return;
    }
    const logout = event.target.closest('[data-action="logout"]');
    if (logout) {
      C.clearSession('teacher');
      teacher = null;
      showToast('已退出教师端');
      go('/login');
      return;
    }
    const demo = event.target.closest('[data-demo]');
    if (demo) {
      const form = demo.closest('form');
      form.querySelector('[name="username"]').value = 'teacher';
      form.querySelector('[name="password"]').value = '123456';
      return;
    }
    const delNotice = event.target.closest('[data-delete-notice]');
    if (delNotice) {
      const id = Number(delNotice.getAttribute('data-delete-notice'));
      const notice = C.noticeById(id);
      confirmAction('删除通知', '确定删除《' + (notice ? notice.title : '这条通知') + '》吗？删除后学生端将不再显示。', function () {
        C.deleteNotice(id);
        showToast('通知已删除');
        renderRoute();
      });
      return;
    }
    const delNews = event.target.closest('[data-delete-news]');
    if (delNews) {
      const id = Number(delNews.getAttribute('data-delete-news'));
      const item = C.state.news.find(function (n) { return Number(n.id) === id; });
      confirmAction('删除新闻', '确定删除《' + (item ? item.title : '这条新闻') + '》吗？', function () {
        C.deleteNews(id);
        showToast('新闻已删除');
        renderRoute();
      });
      return;
    }
    const delVideo = event.target.closest('[data-delete-video]');
    if (delVideo) {
      const id = Number(delVideo.getAttribute('data-delete-video'));
      const item = C.state.videos.find(function (v) { return Number(v.id) === id; });
      confirmAction('删除视频', '确定删除《' + (item ? item.title : '这个视频') + '》吗？', function () {
        C.deleteVideo(id);
        showToast('视频已删除');
        renderRoute();
      });
      return;
    }
    const toggleUser = event.target.closest('[data-toggle-user]');
    if (toggleUser) {
      C.toggleUserStatus(Number(toggleUser.getAttribute('data-toggle-user')));
      showToast('账号状态已更新');
      renderRoute();
      return;
    }
    const preview = event.target.closest('[data-preview-video]');
    if (preview) { openVideoPreview(Number(preview.getAttribute('data-preview-video'))); return; }
    const approve = event.target.closest('[data-approve]');
    if (approve) {
      const id = Number(approve.getAttribute('data-approve'));
      C.reviewVideo(id, 'approved', '内容审核通过', teacher);
      showToast('视频已通过审核并发布');
      renderRoute();
      return;
    }
    const reject = event.target.closest('[data-reject]');
    if (reject) { openReject(Number(reject.getAttribute('data-reject'))); return; }
  });

  document.addEventListener('change', function (event) {
    if (event.target.matches('[name="scope"]')) {
      const wrap = document.getElementById('deptSelectWrap');
      if (wrap) wrap.style.display = event.target.value === 'dept' ? '' : 'none';
    }
    if (event.target.matches('[data-news-category]')) {
      const category = event.target.value;
      go('/news', { category: category });
    }
    if (event.target.matches('#newsCover')) {
      const file = event.target.files[0];
      const preview = document.getElementById('coverPreview');
      if (file && preview) {
        const reader = new FileReader();
        reader.onload = function () { preview.innerHTML = '<img src="' + reader.result + '" style="width:100%;height:100%;object-fit:cover">'; };
        reader.readAsDataURL(file);
      }
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    const type = form.getAttribute('data-form');
    if (!type) return;
    event.preventDefault();
    if (type === 'teacher-login') handleLogin(form);
    else if (type === 'notice') handleNotice(form);
    else if (type === 'news') handleNews(form);
    else if (type === 'notice-filter') {
      const data = new FormData(form);
      go('/notices', {
        q: String(data.get('q') || '').trim(),
        scope: String(data.get('scope') || ''),
        dept: String(data.get('dept') || ''),
        category: String(data.get('category') || '')
      });
    }
  });

  C.subscribe(function (message) {
    teacher = C.currentUser('teacher');
    if (!teacher) {
      if (currentRoute().path !== '/login') go('/login');
      return;
    }
    const path = currentRoute().path;
    if (message.type === 'state' && path !== '/notice/new' && path !== '/news/new' && path.indexOf('/edit/') < 0) {
      renderRoute();
    }
  });

  window.addEventListener('hashchange', renderRoute);
  if (!location.hash) location.hash = teacher ? '#/dashboard' : '#/login';
  renderRoute();
})();
