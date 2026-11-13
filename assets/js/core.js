(function () {
  const DATA_KEY = 'kiera_campus_data_20261113';
  const STUDENT_SESSION = 'kiera_student_session_20261113';
  const TEACHER_SESSION = 'kiera_teacher_session_20261113';
  const READ_PREFIX = 'kiera_notice_reads_';
  const CHANNEL_NAME = 'kiera_campus_updates';
  const VERSION = window.KIERA_SEED && window.KIERA_SEED.version;

  let state = loadState();
  let channel = null;
  let listeners = [];
  let dbPromise = null;
  let memoryFiles = new Map();
  let urlCache = new Map();

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = function (event) {
      const message = event.data || {};
      state = loadState();
      listeners.forEach(function (fn) {
        try { fn(message); } catch (err) { console.warn(err); }
      });
    };
  } catch (err) {
    channel = null;
  }

  function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(data) {
    data.users = Array.isArray(data.users) ? data.users : [];
    data.notices = Array.isArray(data.notices) ? data.notices : [];
    data.news = Array.isArray(data.news) ? data.news : [];
    data.videos = Array.isArray(data.videos) ? data.videos : [];
    data.audit_logs = Array.isArray(data.audit_logs) ? data.audit_logs : [];
    data.browse_logs = Array.isArray(data.browse_logs) ? data.browse_logs : [];
    return data;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.version === VERSION) {
          const before = JSON.stringify(data);
          const normalized = normalize(data);
          normalized.users.forEach(function (u) { if (u.real_name === '沈知秋') u.real_name = '同学'; });
          normalized.videos.forEach(function (v) { if (v.uploader_name === '沈知秋') v.uploader_name = '同学'; });
          if (JSON.stringify(normalized) !== before) localStorage.setItem(DATA_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (err) {
      console.warn(err);
    }
    const data = normalize(clone(window.KIERA_SEED));
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch (err) { console.warn(err); }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  function reset() {
    state = normalize(clone(window.KIERA_SEED));
    save();
    Object.keys(localStorage).forEach(function (key) {
      if (key.indexOf(READ_PREFIX) === 0) localStorage.removeItem(key);
    });
    localStorage.removeItem(STUDENT_SESSION);
    localStorage.removeItem(TEACHER_SESSION);
    if (window.indexedDB) {
      try { indexedDB.deleteDatabase('kiera_media_20261113'); } catch (err) { console.warn(err); }
    }
    emit({ type: 'state' });
  }

  function emit(message) {
    const payload = Object.assign({ type: 'state' }, message || {});
    if (channel) channel.postMessage(payload);
    listeners.forEach(function (fn) {
      try { fn(payload); } catch (err) { console.warn(err); }
    });
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (item) { return item !== fn; });
    };
  }

  window.addEventListener('storage', function (event) {
    if (event.key === DATA_KEY) {
      state = loadState();
      listeners.forEach(function (fn) { fn({ type: 'state' }); });
    }
    if (event.key === STUDENT_SESSION || event.key === TEACHER_SESSION) {
      listeners.forEach(function (fn) { fn({ type: 'session' }); });
    }
  });

  function departments() {
    return state.departments || window.KIERA_SEED.departments;
  }

  function departmentById(id) {
    return departments().find(function (d) { return d.id === id; }) || null;
  }

  function departmentName(id) {
    const d = departmentById(id);
    return d ? d.name : '全校';
  }

  function categories() {
    return state.categories || window.KIERA_SEED.categories;
  }

  function userById(id) {
    return state.users.find(function (u) { return Number(u.id) === Number(id); }) || null;
  }

  function getSession(role) {
    try {
      const key = role === 'teacher' ? TEACHER_SESSION : STUDENT_SESSION;
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      return data && data.userId ? data : null;
    } catch (err) {
      return null;
    }
  }

  function setSession(role, user) {
    const key = role === 'teacher' ? TEACHER_SESSION : STUDENT_SESSION;
    localStorage.setItem(key, JSON.stringify({ userId: user.id, at: Date.now() }));
    emit({ type: 'session', role: role });
  }

  function clearSession(role) {
    localStorage.removeItem(role === 'teacher' ? TEACHER_SESSION : STUDENT_SESSION);
    emit({ type: 'session', role: role });
  }

  function currentUser(role) {
    const session = getSession(role);
    if (!session) return null;
    const user = userById(session.userId);
    if (!user || user.role !== role || Number(user.status) !== 1) {
      clearSession(role);
      return null;
    }
    return user;
  }

  function hashPassword(password, salt) {
    if (!window.CryptoJS) throw new Error('密码组件未加载');
    return CryptoJS.SHA256(String(salt) + ':' + String(password)).toString(CryptoJS.enc.Hex);
  }

  function login(role, username, password) {
    const user = state.users.find(function (u) {
      return String(u.username).toLowerCase() === String(username).trim().toLowerCase() && u.role === role;
    });
    if (!user) return { ok: false, message: '账号或密码错误' };
    if (Number(user.status) !== 1) return { ok: false, message: '该账号已被禁用，请联系管理员' };
    if (hashPassword(password, user.password_salt) !== user.password_hash) {
      return { ok: false, message: '账号或密码错误' };
    }
    setSession(role, user);
    if (role === 'student') ensureReadState(user);
    return { ok: true, user: user };
  }

  function registerStudent(data) {
    const exists = state.users.some(function (u) {
      return u.username.toLowerCase() === String(data.username).toLowerCase();
    });
    if (exists) return { ok: false, message: '该账号已被注册' };
    const salt = randomSalt();
    const user = {
      id: Math.max.apply(null, state.users.map(function (u) { return Number(u.id); }).concat(0)) + 1,
      username: data.username,
      real_name: data.real_name,
      role: 'student',
      status: 1,
      department: data.department,
      title: data.title || '学生',
      created_at: nowString(),
      password_salt: salt,
      password_hash: hashPassword(data.password, salt)
    };
    state.users.push(user);
    save();
    emit({ type: 'state' });
    setSession('student', user);
    ensureReadState(user);
    return { ok: true, user: user };
  }

  function randomSalt() {
    if (window.crypto && crypto.getRandomValues) {
      return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    }
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function visibleNotices(user) {
    return state.notices
      .filter(function (n) {
        if (n.scope === 'all') return true;
        if (!user) return true;
        return n.department === user.department;
      })
      .sort(function (a, b) {
        if (Number(b.is_pinned) !== Number(a.is_pinned)) return Number(b.is_pinned) - Number(a.is_pinned);
        return parseDate(b.published_at) - parseDate(a.published_at);
      });
  }

  function noticeById(id) {
    return state.notices.find(function (n) { return Number(n.id) === Number(id); }) || null;
  }

  function readKey(userId) {
    return READ_PREFIX + userId;
  }

  function readIds(userId) {
    try {
      const data = JSON.parse(localStorage.getItem(readKey(userId)) || 'null');
      return Array.isArray(data) ? data.map(Number) : null;
    } catch (err) {
      return null;
    }
  }

  function ensureReadState(user) {
    if (!user || user.role !== 'student') return;
    if (readIds(user.id) !== null) return;
    const visible = visibleNotices(user);
    const ids = visible.slice(2).map(function (n) { return Number(n.id); });
    localStorage.setItem(readKey(user.id), JSON.stringify(ids));
  }

  function unreadNotices(user) {
    if (!user) return [];
    ensureReadState(user);
    const read = new Set(readIds(user.id) || []);
    return visibleNotices(user).filter(function (n) { return !read.has(Number(n.id)); });
  }

  function markNoticeRead(user, noticeId) {
    if (!user) return;
    const current = (readIds(user.id) || []).map(Number);
    if (current.indexOf(Number(noticeId)) >= 0) return;
    const ids = new Set(current);
    ids.add(Number(noticeId));
    localStorage.setItem(readKey(user.id), JSON.stringify(Array.from(ids)));
    emit({ type: 'reads' });
  }

  function markAllNoticesRead(user) {
    if (!user) return;
    const ids = visibleNotices(user).map(function (n) { return Number(n.id); });
    const old = new Set((readIds(user.id) || []).map(Number));
    if (ids.length === old.size && ids.every(function (id) { return old.has(id); })) return;
    localStorage.setItem(readKey(user.id), JSON.stringify(ids));
    emit({ type: 'reads' });
  }

  function announceNotice(notice) {
    if (Notification && Notification.permission === 'granted') {
      try {
        new Notification('校园信息港新通知', {
          body: (notice.scope === 'all' ? '全校通知：' : departmentName(notice.department) + '：') + notice.title,
          tag: 'kiera-notice-' + notice.id
        });
      } catch (err) { console.warn(err); }
    }
    emit({ type: 'notice:new', notice: notice });
  }

  function addNotice(data, teacher) {
    const notice = {
      id: Math.max.apply(null, state.notices.map(function (n) { return Number(n.id); }).concat(0)) + 1,
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category,
      scope: data.scope,
      department: data.scope === 'dept' ? data.department : null,
      priority: data.priority,
      is_pinned: data.is_pinned ? 1 : 0,
      publisher_id: teacher.id,
      publisher_name: teacher.real_name,
      published_at: data.published_at || nowString(),
      views: 0
    };
    state.notices.unshift(notice);
    save();
    announceNotice(notice);
    return notice;
  }

  function updateNotice(id, data) {
    const notice = noticeById(id);
    if (!notice) return null;
    Object.assign(notice, {
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category,
      scope: data.scope,
      department: data.scope === 'dept' ? data.department : null,
      priority: data.priority,
      is_pinned: data.is_pinned ? 1 : 0,
      published_at: data.published_at || notice.published_at
    });
    save();
    emit({ type: 'notice:update', notice: notice });
    return notice;
  }

  function deleteNotice(id) {
    state.notices = state.notices.filter(function (n) { return Number(n.id) !== Number(id); });
    save();
    emit({ type: 'notice:delete', id: Number(id) });
  }

  function addNews(data, teacher) {
    const item = {
      id: Math.max.apply(null, state.news.map(function (n) { return Number(n.id); }).concat(0)) + 1,
      title: data.title,
      category: data.category,
      summary: data.summary,
      content: data.content,
      cover_image: data.cover_image || '',
      cover_key: data.cover_key || '',
      views: 0,
      is_home: data.is_home ? 1 : 0,
      published_at: data.published_at || nowString(),
      created_by: teacher.id,
      creator_name: teacher.real_name
    };
    state.news.unshift(item);
    save();
    emit({ type: 'state' });
    return item;
  }

  function updateNews(id, data) {
    const item = state.news.find(function (n) { return Number(n.id) === Number(id); });
    if (!item) return null;
    Object.assign(item, data);
    save();
    emit({ type: 'state' });
    return item;
  }

  function deleteNews(id) {
    state.news = state.news.filter(function (n) { return Number(n.id) !== Number(id); });
    save();
    emit({ type: 'state' });
  }

  function reviewVideo(id, result, reason, teacher) {
    const video = state.videos.find(function (v) { return Number(v.id) === Number(id); });
    if (!video || video.status !== 'pending') return null;
    video.status = result;
    video.reject_reason = result === 'rejected' ? reason : null;
    video.reviewer_id = teacher.id;
    video.reviewer_name = teacher.real_name;
    video.reviewed_at = nowString();
    state.audit_logs.unshift({
      id: Math.max.apply(null, state.audit_logs.map(function (l) { return Number(l.id); }).concat(0)) + 1,
      video_id: video.id,
      video_title: video.title,
      reviewer_id: teacher.id,
      reviewer_name: teacher.real_name,
      result: result,
      reason: reason || '内容审核通过',
      created_at: video.reviewed_at
    });
    save();
    emit({ type: 'state' });
    return video;
  }

  function addVideo(data, student) {
    const video = {
      id: Math.max.apply(null, state.videos.map(function (v) { return Number(v.id); }).concat(0)) + 1,
      title: data.title,
      category: data.category,
      description: data.description,
      video_path: '',
      video_key: data.video_key,
      cover_image: data.cover_image || '',
      cover_key: data.cover_key,
      uploader_id: student.id,
      uploader_name: student.real_name,
      uploader_username: student.username,
      status: 'pending',
      reject_reason: null,
      reviewer_id: null,
      reviewer_name: '',
      reviewed_at: null,
      views: 0,
      created_at: nowString()
    };
    state.videos.unshift(video);
    save();
    emit({ type: 'state' });
    return video;
  }

  function deleteVideo(id) {
    state.videos = state.videos.filter(function (v) { return Number(v.id) !== Number(id); });
    state.audit_logs = state.audit_logs.filter(function (l) { return Number(l.video_id) !== Number(id); });
    save();
    emit({ type: 'state' });
  }

  function toggleUserStatus(id) {
    const user = userById(id);
    if (!user || user.role !== 'student') return null;
    user.status = Number(user.status) === 1 ? 0 : 1;
    save();
    emit({ type: 'state' });
    return user;
  }

  function formatDate(value, withTime) {
    const d = parseDate(value);
    if (!d.getTime()) return '';
    const base = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return withTime ? base + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : base;
  }

  function parseDate(value) {
    if (!value) return new Date(0);
    const d = new Date(String(value).replace(' ', 'T'));
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  function nowString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':00';
  }

  function relativeTime(value) {
    const d = parseDate(value);
    const diff = Date.now() - d.getTime();
    if (diff < 0) return formatDate(value, true);
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
    return formatDate(value);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function scopeText(item) {
    return item.scope === 'all' ? '全校' : departmentName(item.department);
  }

  function priorityText(priority) {
    return { urgent: '紧急', important: '重要', normal: '普通' }[priority] || '普通';
  }

  function categoryClass(category) {
    return {
      '通学出行': 'cat-travel',
      '安全提醒': 'cat-safety',
      '教学安排': 'cat-study',
      '校园生活': 'cat-life',
      '系部通知': 'cat-dept',
      '活动比赛': 'cat-event',
      '后勤服务': 'cat-service',
      '竞赛实训': 'cat-skill'
    }[category] || 'cat-default';
  }

  function openMediaDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no indexeddb'));
      const req = indexedDB.open('kiera_media_20261113', 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains('files')) req.result.createObjectStore('files');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    }).catch(function (err) {
      console.warn(err);
      return null;
    });
    return dbPromise;
  }

  async function putMedia(key, blob) {
    const db = await openMediaDB();
    if (!db) {
      memoryFiles.set(key, blob);
      return key;
    }
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(blob, key);
      tx.oncomplete = function () { resolve(key); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  async function getMedia(key) {
    if (!key) return null;
    if (memoryFiles.has(key)) return memoryFiles.get(key);
    const db = await openMediaDB();
    if (!db) return null;
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(key);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function mediaUrl(key) {
    if (!key) return '';
    if (urlCache.has(key)) return urlCache.get(key);
    const blob = await getMedia(key);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    urlCache.set(key, url);
    return url;
  }

  async function deleteMedia(key) {
    if (!key) return;
    memoryFiles.delete(key);
    if (urlCache.has(key)) {
      try { URL.revokeObjectURL(urlCache.get(key)); } catch (err) { console.warn(err); }
      urlCache.delete(key);
    }
    const db = await openMediaDB();
    if (!db) return;
    await new Promise(function (resolve) {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  }

  async function hydrateMedia(root) {
    const images = Array.from((root || document).querySelectorAll('[data-cover-key]'));
    for (const img of images) {
      const url = await mediaUrl(img.getAttribute('data-cover-key'));
      if (url) img.src = url;
    }
    const videos = Array.from((root || document).querySelectorAll('[data-video-key]'));
    for (const video of videos) {
      const url = await mediaUrl(video.getAttribute('data-video-key'));
      if (url) {
        video.src = url;
        video.load();
      }
    }
  }

  function departmentStats() {
    return departments().map(function (dept) {
      const list = visibleNotices(null).filter(function (n) {
        return n.scope === 'dept' && n.department === dept.id;
      });
      return {
        department: dept,
        count: list.length,
        latest: list[0] || null
      };
    });
  }

  function searchItems(query, user) {
    const text = String(query || '').trim();
    if (!text) return [];
    const normalized = text.replace(/[，。！？、；：,.!?;:\s]/g, '');
    const deptMention = departments().find(function (d) {
      return normalized.indexOf(d.name) >= 0 || normalized.indexOf(d.short) >= 0;
    });
    const intentMap = {
      '通学出行': ['通学', '道路', '施工', '公交', '校车', '出行', '封路', '维修', '上学', '放学', '交通'],
      '安全提醒': ['消防', '演练', '安全', '应急', '疏散', '危险'],
      '教学安排': ['教学', '课程', '考试', '学习', '图书馆', '机房', '安排', '上课'],
      '校园生活': ['食堂', '吃饭', '供餐', '生活', '宿舍', '校服', '一卡通'],
      '活动比赛': ['活动', '比赛', '社团', '志愿者', '宣讲', '报名', '运动会'],
      '后勤服务': ['网络', '断网', '维修', '后勤', '设备', '报修'],
      '竞赛实训': ['竞赛', '实训', '技能', '选拔', '训练', '比赛'],
      '系部通知': ['系部', '通知']
    };
    let intent = null;
    Object.keys(intentMap).some(function (key) {
      if (intentMap[key].some(function (word) { return normalized.indexOf(word) >= 0; })) {
        intent = key;
        return true;
      }
      return false;
    });
    const stop = ['请问', '我想', '知道', '一下', '学校', '有没有', '什么', '怎么', '哪里', '什么时候', '多久', '最近', '通知', '公告', '关于', '情况', '相关', '可以', '能不能', '帮我', '查', '的', '了', '吗', '呢'];
    let clean = normalized;
    stop.forEach(function (word) { clean = clean.split(word).join(' '); });
    const chunks = clean.split(/\s+/).filter(function (x) { return x.length >= 2; });
    const terms = new Set();
    chunks.forEach(function (chunk) {
      for (let size = 2; size <= Math.min(5, chunk.length); size++) {
        for (let i = 0; i <= chunk.length - size; i++) terms.add(chunk.slice(i, i + size));
      }
    });
    if (intent) intentMap[intent].forEach(function (w) { terms.add(w); });

    const results = [];
    const sourceNotices = visibleNotices(user);
    sourceNotices.forEach(function (n) {
      const title = [n.title, n.summary, n.category].join(' ');
      const body = [n.title, n.summary, n.content, n.category, departmentName(n.department)].join(' ');
      let score = 0;
      if (normalized.length >= 3 && title.indexOf(normalized) >= 0) score += 20;
      terms.forEach(function (term) {
        if (term.length < 2) return;
        if (n.title.indexOf(term) >= 0) score += 7;
        else if ((n.summary || '').indexOf(term) >= 0) score += 3;
        else if ((n.content || '').indexOf(term) >= 0) score += 1;
        if (n.category.indexOf(term) >= 0) score += 2;
      });
      if (deptMention && n.department === deptMention.id) score += 12;
      if (deptMention && n.scope === 'all') score += 2;
      if (intent && n.category === intent) score += 6;
      if (n.priority === 'urgent') score += 3;
      if (Number(n.is_pinned)) score += 2;
      score += Math.max(0, 7 - (Date.now() - parseDate(n.published_at).getTime()) / 86400000) * 0.4;
      if (score > 4) results.push({ type: 'notice', item: n, score: score });
    });

    state.news.forEach(function (n) {
      const body = [n.title, n.summary, n.content, n.category].join(' ');
      let score = 0;
      if (normalized.length >= 3 && n.title.indexOf(normalized) >= 0) score += 14;
      terms.forEach(function (term) {
        if (term.length < 2) return;
        if (n.title.indexOf(term) >= 0) score += 4;
        else if (body.indexOf(term) >= 0) score += 1;
      });
      score += Math.max(0, 5 - (Date.now() - parseDate(n.published_at).getTime()) / 86400000) * 0.2;
      if (score > 3) results.push({ type: 'news', item: n, score: score });
    });

    state.videos.filter(function (v) { return v.status === 'approved'; }).forEach(function (v) {
      const body = [v.title, v.description, v.category].join(' ');
      let score = 0;
      if (normalized.length >= 3 && v.title.indexOf(normalized) >= 0) score += 12;
      terms.forEach(function (term) {
        if (term.length < 2) return;
        if (v.title.indexOf(term) >= 0) score += 3;
        else if (body.indexOf(term) >= 0) score += 1;
      });
      if (score > 3) results.push({ type: 'video', item: v, score: score });
    });

    return results.sort(function (a, b) { return b.score - a.score; });
  }

  function askAI(question, user) {
    const query = String(question || '').trim();
    if (!query) {
      return { answer: '你可以直接问我校园里的通知、系部安排、新闻或视频，例如“通学路维修到什么时候”。', sources: [] };
    }
    const results = searchItems(query, user).slice(0, 4);
    if (!results.length) {
      return {
        answer: '暂时没有找到与这个问题直接相关的内容。可以换成更具体的关键词，例如“通学路”“信息工程系”“助学金”或“消防演练”。',
        sources: []
      };
    }
    const top = results[0];
    let answer = '';
    if (top.type === 'notice') {
      const n = top.item;
      answer = '我查到一条' + scopeText(n) + '通知：《' + n.title + '》。\n\n发布时间：' + formatDate(n.published_at, true) + '。\n\n' + excerpt(n.content, 190);
      if (n.priority === 'urgent') answer = '这条通知比较紧急，请优先查看。\n\n' + answer;
    } else if (top.type === 'news') {
      answer = '我找到一条相关校园新闻：《' + top.item.title + '》。\n\n' + excerpt(top.item.summary, 150);
    } else {
      answer = '我找到一条相关校园视频：《' + top.item.title + '》。\n\n' + excerpt(top.item.description, 150);
    }
    if (results.length > 1) {
      answer += '\n\n另外还找到 ' + (results.length - 1) + ' 条相关内容，已放在下方来源里。';
    }
    return {
      answer: answer,
      sources: results.map(function (r) { return { type: r.type, item: r.item }; })
    };
  }

  function excerpt(text, len) {
    const plain = String(text || '').replace(/\s+/g, ' ').trim();
    return plain.length > len ? plain.slice(0, len) + '…' : plain;
  }

  function requestNotification() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    return Notification.requestPermission();
  }

  window.KIERA = window.KIERA || {};
  window.KIERA.core = {
    get state() { return state; },
    save,
    reset,
    loadState,
    emit,
    subscribe,
    departments,
    departmentById,
    departmentName,
    categories,
    userById,
    currentUser,
    login,
    registerStudent,
    clearSession,
    visibleNotices,
    noticeById,
    unreadNotices,
    markNoticeRead,
    markAllNoticesRead,
    addNotice,
    updateNotice,
    deleteNotice,
    addNews,
    updateNews,
    deleteNews,
    reviewVideo,
    addVideo,
    deleteVideo,
    toggleUserStatus,
    formatDate,
    parseDate,
    nowString,
    relativeTime,
    escapeHtml,
    scopeText,
    priorityText,
    categoryClass,
    mediaUrl,
    putMedia,
    deleteMedia,
    hydrateMedia,
    departmentStats,
    askAI,
    searchItems,
    requestNotification,
    excerpt
  };
})();
