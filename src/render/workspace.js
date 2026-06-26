import { S, saveState } from '../state/store.js';
import { getCurrentWorkspace, getUser, isWorkspaceOwner, uploadWorkspaceFile, deleteWorkspaceFile, fetchWorkspaceFileBlob } from '../ui/auth.js';

const LINK_TYPES = [
  ['drive', 'Google Drive'],
  ['miro', 'Miro'],
  ['figma', 'Figma'],
  ['notion', 'Notion'],
  ['sheet', 'Таблица'],
  ['doc', 'Документ'],
  ['telegram', 'Telegram'],
  ['site', 'Сайт'],
  ['other', 'Другое'],
];

const NOTE_TYPES = [
  ['idea', 'идея'],
  ['decision', 'решение'],
  ['question', 'вопрос'],
  ['task', 'ТЗ'],
  ['access', 'доступы'],
  ['meeting', 'встреча'],
];

let _noteAutosaveTimer = null;
let _noteStatusTimer = null;
let _activeEditorNoteId = null;
let _noteDirty = false;
let _savedEditorRange = null;
let _tiptapEditor = null;
let _tiptapModulesPromise = null;
let _linkFilter = 'all';
let _linkSearch = '';
let _linkModal = null;
let _filePreview = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function area() {
  if (!S.workspaceArea || typeof S.workspaceArea !== 'object') S.workspaceArea = { notes: [], links: [] };
  if (!Array.isArray(S.workspaceArea.notes)) S.workspaceArea.notes = [];
  if (!Array.isArray(S.workspaceArea.links)) S.workspaceArea.links = [];
  return S.workspaceArea;
}

function nowIso() {
  return new Date().toISOString();
}

function loadTiptapModules() {
  if (!_tiptapModulesPromise) {
    _tiptapModulesPromise = Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-link'),
      import('@tiptap/extension-placeholder'),
      import('@tiptap/extension-task-list'),
      import('@tiptap/extension-task-item'),
      import('@tiptap/extension-image'),
      import('@tiptap/extension-typography'),
    ]).then(([core, starterKit, link, placeholder, taskList, taskItem, image, typography]) => ({
      Editor: core.Editor,
      StarterKit: starterKit.default,
      Link: link.default,
      Placeholder: placeholder.default,
      TaskList: taskList.default,
      TaskItem: taskItem.default,
      Image: image.default,
      Typography: typography.default,
    }));
  }
  return _tiptapModulesPromise;
}

function actorMeta() {
  const user = getUser?.();
  return {
    name: user?.name || user?.email || 'Участник',
    avatarUrl: user?.avatar_url || '',
  };
}

function avatarHtml(name, avatarUrl = '') {
  const initial = String(name || 'У')[0]?.toUpperCase() || 'У';
  if (avatarUrl) return `<span class="work-author-avatar"><img src="${esc(avatarUrl)}" alt=""></span>`;
  return `<span class="work-author-avatar">${esc(initial)}</span>`;
}

function nextId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function setEditorStatus(text, mode = 'muted') {
  const el = document.getElementById('workspace-note-save-status');
  if (!el) return;
  el.textContent = text;
  el.dataset.mode = mode;
  clearTimeout(_noteStatusTimer);
  if (mode === 'saved') {
    _noteStatusTimer = setTimeout(() => {
      const next = document.getElementById('workspace-note-save-status');
      if (next) {
        next.textContent = 'Сохранено';
        next.dataset.mode = 'muted';
      }
    }, 1800);
  }
}

function normalizeUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = String(html || '');
  return div.textContent || div.innerText || '';
}

function isEmptyDraftNote(note) {
  if (!note || !note.draft) return false;
  return !noteHasEditorText(note);
}

function noteHasEditorText(note) {
  if (!note) return false;
  const titleInput = _activeEditorNoteId === note.id ? document.getElementById('workspace-note-title') : null;
  const bodyInput = _activeEditorNoteId === note.id ? document.getElementById('workspace-note-body') : null;
  const currentBody = (_tiptapEditor && _activeEditorNoteId === note.id)
    ? _tiptapEditor.getHTML()
    : (bodyInput?.innerHTML || note.body || '');
  return !!stripHtml(cleanEditorHtml(currentBody)).trim();
}

function discardDraftNote(id, persist = false) {
  const data = area();
  const note = data.notes.find(item => item.id === id);
  if (!isEmptyDraftNote(note)) return false;
  data.notes = data.notes.filter(item => item.id !== id);
  S.workspaceArea.notes = data.notes;
  clearTimeout(_noteAutosaveTimer);
  _noteDirty = false;
  if (persist) saveState();
  return true;
}

function cleanupEmptyDraftNotes(data) {
  const before = data.notes.length;
  data.notes = data.notes.filter(item => !isEmptyDraftNote(item));
  if (data.notes.length === before) return;
  S.workspaceArea.notes = data.notes;
  saveState();
}

function cleanEditorHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE', 'HR', 'LABEL', 'INPUT', 'SPAN', 'IMG']);
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }
        [...child.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          if (child.tagName === 'A' && name === 'href') {
            const href = normalizeUrl(attr.value);
            if (/^https?:\/\//i.test(href)) {
              child.setAttribute('href', href);
              child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener');
            } else {
              child.removeAttribute('href');
            }
          } else if ((child.tagName === 'UL' && name === 'data-type' && attr.value === 'taskList')
            || (child.tagName === 'LI' && name === 'data-type' && attr.value === 'taskItem')
            || (child.tagName === 'LI' && name === 'data-checked' && /^(true|false)$/i.test(attr.value))) {
            child.setAttribute(name, attr.value);
          } else if (child.tagName === 'INPUT' && name === 'type' && attr.value === 'checkbox') {
            child.setAttribute('type', 'checkbox');
            child.setAttribute('disabled', '');
          } else if (child.tagName === 'INPUT' && name === 'checked') {
            child.setAttribute('checked', '');
          } else if (child.tagName === 'INPUT' && name === 'disabled') {
            child.setAttribute('disabled', '');
          } else if (child.tagName === 'IMG' && name === 'src') {
            const src = String(attr.value || '').trim();
            if (/^https?:\/\//i.test(src)) {
              child.setAttribute('src', src);
              child.setAttribute('loading', 'lazy');
            } else {
              child.removeAttribute('src');
            }
          } else if (child.tagName === 'IMG' && (name === 'alt' || name === 'title')) {
            child.setAttribute(name, attr.value.slice(0, 160));
          } else {
            child.removeAttribute(attr.name);
          }
        });
        walk(child);
      }
    });
  };
  walk(template.content);
  return template.innerHTML.trim();
}

function linkTypeLabel(type) {
  return LINK_TYPES.find(([key]) => key === type)?.[1] || 'Ссылка';
}

function renderLinkTypeOptions(active) {
  return LINK_TYPES.map(([key, label]) => `<option value="${key}" ${active === key ? 'selected' : ''}>${label}</option>`).join('');
}

function noteTypeLabel(type) {
  return NOTE_TYPES.find(([key]) => key === type)?.[1] || 'заметка';
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function notePreview(note) {
  const text = stripHtml(cleanEditorHtml(note.body || '')).trim();
  return text ? esc(text.slice(0, 180)) : 'Пока нет текста';
}

function noteFiles(note) {
  if (!Array.isArray(note.files)) note.files = [];
  return note.files;
}

function formatFileSize(size) {
  const n = Number(size || 0);
  if (!n) return '';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`;
  return `${(n / 1024 / 1024).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1)} МБ`;
}

function fileIcon(file) {
  const type = String(file?.content_type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  if (type.includes('image/')) return 'image';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'file-text';
  if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'sheet';
  if (type.includes('word') || name.endsWith('.docx')) return 'file-type';
  return 'paperclip';
}

function isPreviewImage(file) {
  const type = String(file?.content_type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
}

function shouldPreviewBlob(file, blob) {
  const blobType = String(blob?.type || '').toLowerCase();
  return blobType.startsWith('image/') || isPreviewImage(file);
}

function downloadBlob(blob, filename = 'file') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function validateWorkspaceUploadFile(file) {
  if (!file) return 'Выберите файл';
  const allowedExt = /\.(pdf|docx|xlsx|csv|txt|png|jpe?g|webp)$/i;
  const allowedMime = /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/csv|text\/plain|image\/png|image\/jpeg|image\/webp)$/i;
  if (!allowedExt.test(file.name || '') && !allowedMime.test(file.type || '')) {
    return 'Можно загрузить PDF, DOCX, XLSX, CSV, TXT, PNG, JPG или WebP';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'Файл должен быть не больше 10 МБ';
  }
  return '';
}

function canDeleteNoteFile(file) {
  const user = getUser?.();
  return !!(isWorkspaceOwner?.() || user?.is_admin || Number(file?.uploaded_by_user_id || 0) === Number(user?.id || 0));
}

function renderNoteFiles(note, editable = false) {
  const files = noteFiles(note);
  return `
    <section class="workspace-note-files">
      <div class="workspace-note-files-head">
        <div>
          <h3>Вложения</h3>
          <p>PDF, DOCX, XLSX, CSV, TXT, PNG, JPG или WebP до 10 МБ.</p>
        </div>
        ${editable ? `
          <label class="btn-outline workspace-file-upload">
            <i data-lucide="paperclip" class="icon"></i> Прикрепить файл
            <input type="file" onchange="workspaceUploadNoteFile('${esc(note.id)}', this.files?.[0]); this.value=''" accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,image/png,image/jpeg,image/webp">
          </label>
        ` : ''}
      </div>
      <div class="workspace-note-file-list">
        ${files.length ? files.map(file => `
          <article class="workspace-note-file ${isPreviewImage(file) ? 'is-image' : ''}">
            <button class="workspace-note-file-main" onclick="workspaceOpenNoteFile('${esc(note.id)}','${esc(file.id)}')">
              <span class="workspace-note-file-icon"><i data-lucide="${fileIcon(file)}" class="icon"></i></span>
              <span>
                <strong>${esc(file.name || 'Файл')}</strong>
                <small>${isPreviewImage(file) ? 'Изображение · ' : ''}${esc(formatFileSize(file.size))}${file.created_at ? ` · ${esc(formatDate(file.created_at))}` : ''}</small>
              </span>
            </button>
            ${canDeleteNoteFile(file) ? `
              <button class="btn-outline work-mini-btn danger" onclick="workspaceDeleteNoteFile('${esc(note.id)}','${esc(file.id)}')" title="Удалить файл"><i data-lucide="trash-2" class="icon"></i></button>
            ` : ''}
          </article>
        `).join('') : '<div class="workspace-empty workspace-file-empty">Файлы пока не прикреплены.</div>'}
      </div>
      ${renderFilePreviewModal()}
    </section>
  `;
}

function renderFilePreviewModal() {
  if (!_filePreview?.url) return '';
  return `
    <div class="workspace-file-preview-backdrop" onclick="workspaceCloseFilePreview()">
      <section class="workspace-file-preview" onclick="event.stopPropagation()">
        <header>
          <strong>${esc(_filePreview.name || 'Изображение')}</strong>
          <button class="btn-outline work-mini-btn" onclick="workspaceCloseFilePreview()" title="Закрыть"><i data-lucide="x" class="icon"></i></button>
        </header>
        <img src="${esc(_filePreview.url)}" alt="${esc(_filePreview.name || 'Изображение')}">
        <footer>
          <button class="btn-outline" onclick="workspaceCloseFilePreview()">Закрыть</button>
        </footer>
      </section>
    </div>
  `;
}

function linkHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function sortLinks(links) {
  return [...links].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function filterLinks(links) {
  const query = String(_linkSearch || '').trim().toLowerCase();
  return sortLinks(links).filter(link => {
    const typeOk = _linkFilter === 'all' || (_linkFilter === 'pinned' ? link.pinned : link.type === _linkFilter);
    if (!typeOk) return false;
    if (!query) return true;
    const haystack = [
      link.title,
      link.description,
      link.url,
      linkHost(normalizeUrl(link.url)),
      linkTypeLabel(link.type),
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function renderWorkspaceTabs(active, data) {
  const tabs = [
    ['overview', 'Обзор', 'layout-dashboard', ''],
    ['notes', 'Заметки', 'file-text', data.notes.length],
    ['links', 'Ссылки', 'link-2', data.links.length],
  ];
  return `
    <div class="workspace-tabs" role="tablist" aria-label="Разделы рабочей зоны">
      ${tabs.map(([key, label, icon, count]) => `
        <button type="button" class="${active === key ? 'active' : ''}" onclick="workspaceSetView('${key}')">
          <i data-lucide="${icon}" class="icon"></i>
          ${label}
          ${count !== '' ? `<span>${count}</span>` : ''}
        </button>
      `).join('')}
    </div>
  `;
}

function renderNoteTypeOptions(active) {
  return NOTE_TYPES.map(([key, label]) => `<option value="${key}" ${active === key ? 'selected' : ''}>${label}</option>`).join('');
}

function renderQuickStart() {
  return `
    <section class="workspace-card workspace-quickstart">
      <div class="workspace-card-head">
        <div>
          <h2>Быстрый старт</h2>
          <p>Добавьте основные материалы, чтобы команда сразу понимала, где искать документы и договорённости.</p>
        </div>
      </div>
      <div class="workspace-quick-grid">
        <button onclick="workspaceNewLink('Google Drive')"><i data-lucide="folder-plus" class="icon"></i><span>Google Drive</span><small>Папка с документами</small></button>
        <button onclick="workspaceNewLink('Miro')"><i data-lucide="workflow" class="icon"></i><span>Miro</span><small>Карта запуска</small></button>
        <button onclick="workspaceNewNote('Концепция проекта')"><i data-lucide="file-plus-2" class="icon"></i><span>Концепция</span><small>Первая заметка</small></button>
      </div>
    </section>
  `;
}

function emptyState(title, text, actionHtml = '') {
  return `
    <div class="workspace-empty workspace-empty-action">
      <strong>${esc(title)}</strong>
      <span>${esc(text)}</span>
      ${actionHtml}
    </div>
  `;
}

function renderLinkControls(data) {
  if (!data.links.length) return '';
  const filters = [
    ['all', 'Все', data.links.length],
    ['pinned', 'Закреплённые', data.links.filter(link => link.pinned).length],
    ...LINK_TYPES.map(([key, label]) => [key, label, data.links.filter(link => link.type === key).length]),
  ].filter(([key, , count]) => key === 'all' || Number(count) > 0);
  if (!filters.some(([key]) => key === _linkFilter)) _linkFilter = 'all';
  return `
    <div class="workspace-link-tools">
      <div class="workspace-link-search">
        <i data-lucide="search" class="icon"></i>
        <input value="${esc(_linkSearch)}" placeholder="Поиск по названию, описанию или домену" oninput="workspaceSetLinkSearch(this.value)">
      </div>
      <div class="workspace-link-filters">
        ${filters.map(([key, label, count]) => `
          <button class="${_linkFilter === key ? 'active' : ''}" onclick="workspaceSetLinkFilter('${esc(key)}')">
            ${esc(label)} <span>${Number(count) || 0}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLinkModal() {
  if (!_linkModal) return '';
  const data = area();
  const isEdit = _linkModal.mode === 'edit';
  const isView = _linkModal.mode === 'view';
  const link = isEdit || isView ? data.links.find(item => item.id === _linkModal.id) : null;
  if ((isEdit || isView) && !link) {
    _linkModal = null;
    return '';
  }
  const normalizedUrl = normalizeUrl(link?.url || _linkModal.url || '');
  const title = link?.title || _linkModal.title || '';
  const description = link?.description || '';
  const type = link?.type || guessLinkType(normalizedUrl);
  const pinned = !!link?.pinned || (!isEdit && !isView && data.links.length === 0);
  const author = link ? (link.updatedBy || link.createdBy || 'участник') : '';
  const avatarUrl = link ? (link.updatedAvatarUrl || link.createdAvatarUrl || '') : '';
  const host = linkHost(normalizedUrl);
  return `
    <div class="workspace-modal-backdrop" onclick="workspaceCloseLinkModal()">
      <section class="workspace-link-modal" onclick="event.stopPropagation()">
        <header>
          <div>
            <h2>${isView ? esc(title || 'Ссылка') : isEdit ? 'Редактировать ссылку' : 'Новая ссылка'}</h2>
            <p>${isView ? esc(host || normalizedUrl || 'Материал проекта') : 'Добавьте понятное название, тип и назначение ссылки для команды.'}</p>
          </div>
          <button class="btn-outline work-mini-btn" onclick="workspaceCloseLinkModal()" title="Закрыть"><i data-lucide="x" class="icon"></i></button>
        </header>

        ${isView ? `
          <div class="workspace-link-detail">
            <div class="work-link-kicker">${esc(linkTypeLabel(type))}${pinned ? ' · закреплено' : ''}</div>
            ${description ? `<p>${esc(description)}</p>` : '<p class="muted">Описание пока не добавлено.</p>'}
            <a href="${esc(normalizedUrl)}" target="_blank" rel="noopener">${esc(normalizedUrl)}</a>
            <div class="work-author-line">
              ${avatarHtml(author, avatarUrl)}
              <small>изменил ${esc(author)} · ${esc(formatDate(link.updatedAt || link.createdAt))}</small>
            </div>
          </div>
          <footer>
            <button class="btn-outline" onclick="workspaceCopyLink('${esc(link.id)}')"><i data-lucide="copy" class="icon"></i> Скопировать</button>
            <button class="btn-outline" onclick="workspaceEditLink('${esc(link.id)}')"><i data-lucide="pencil" class="icon"></i> Редактировать</button>
            <button class="btn-primary" onclick="workspaceOpenProjectLink('${esc(link.id)}')"><i data-lucide="external-link" class="icon"></i> Открыть</button>
          </footer>
        ` : `
          <div class="workspace-link-form">
            <label>
              <span>URL</span>
              <input id="workspace-project-link-url" value="${esc(normalizedUrl)}" placeholder="https://" oninput="workspaceAutofillLinkType()">
            </label>
            <div class="workspace-link-form-row">
              <label>
                <span>Название</span>
                <input id="workspace-project-link-title" value="${esc(title)}" placeholder="Например: Общая папка проекта">
              </label>
              <label>
                <span>Тип</span>
                <select id="workspace-project-link-type">${renderLinkTypeOptions(type)}</select>
              </label>
            </div>
            <label>
              <span>Описание</span>
              <textarea id="workspace-project-link-description" rows="4" placeholder="Для чего эта ссылка нужна команде">${esc(description)}</textarea>
            </label>
            <label class="workspace-link-pin-row">
              <input id="workspace-project-link-pinned" type="checkbox" ${pinned ? 'checked' : ''}>
              <span>Закрепить в важных материалах проекта</span>
            </label>
          </div>
          <footer>
            <button class="btn-outline" onclick="workspaceCloseLinkModal()">Отмена</button>
            <button class="btn-primary" onclick="workspaceSaveProjectLink('${esc(isEdit ? link.id : '')}')"><i data-lucide="save" class="icon"></i> Сохранить</button>
          </footer>
        `}
      </section>
    </div>
  `;
}

function renderLinkCard(link) {
  const url = normalizeUrl(link.url);
  const author = link.updatedBy || link.createdBy || 'участник';
  const avatarUrl = link.updatedAvatarUrl || link.createdAvatarUrl || '';
  return `
    <article class="work-link-card ${link.pinned ? 'is-pinned' : ''}" onclick="workspaceViewLink('${esc(link.id)}')">
      <div class="work-link-main">
        <div class="work-link-kicker">${esc(linkTypeLabel(link.type))}${link.pinned ? ' · закреплено' : ''}</div>
        <h3>${esc(link.title || linkHost(url) || 'Ссылка')}</h3>
        ${link.description ? `<p>${esc(link.description)}</p>` : ''}
        <a href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(linkHost(url) || url)}</a>
        <div class="work-author-line">
          ${avatarHtml(author, avatarUrl)}
          <small>${link.updatedBy ? 'изменил' : 'добавил'} ${esc(author)} · ${esc(formatDate(link.updatedAt || link.createdAt))}</small>
        </div>
      </div>
      <div class="work-card-actions">
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceOpenProjectLink('${esc(link.id)}')" title="Открыть"><i data-lucide="external-link" class="icon"></i></button>
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceCopyLink('${esc(link.id)}')" title="Скопировать"><i data-lucide="copy" class="icon"></i></button>
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceTogglePinLink('${esc(link.id)}')" title="Закрепить"><i data-lucide="${link.pinned ? 'pin-off' : 'pin'}" class="icon"></i></button>
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceEditLink('${esc(link.id)}')" title="Редактировать"><i data-lucide="pencil" class="icon"></i></button>
        <button class="btn-outline work-mini-btn danger" onclick="event.stopPropagation(); workspaceDeleteLink('${esc(link.id)}')" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button>
      </div>
    </article>
  `;
}

function renderOverviewLinkCard(link) {
  const url = normalizeUrl(link.url);
  return `
    <article class="work-link-card work-link-card-compact ${link.pinned ? 'is-pinned' : ''}" onclick="workspaceViewLink('${esc(link.id)}')">
      <div class="work-link-main">
        <div class="work-link-kicker">${esc(linkTypeLabel(link.type))}${link.pinned ? ' · закреплено' : ''}</div>
        <h3>${esc(link.title || linkHost(url) || 'Ссылка')}</h3>
        ${link.description ? `<p>${esc(link.description)}</p>` : ''}
        <a href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(linkHost(url) || url)}</a>
      </div>
      <div class="work-card-actions">
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceOpenProjectLink('${esc(link.id)}')" title="Открыть"><i data-lucide="external-link" class="icon"></i></button>
        <button class="btn-outline work-mini-btn" onclick="event.stopPropagation(); workspaceCopyLink('${esc(link.id)}')" title="Скопировать"><i data-lucide="copy" class="icon"></i></button>
      </div>
    </article>
  `;
}

function renderNoteCard(note) {
  const author = note.updatedBy || note.createdBy || 'участник';
  const avatarUrl = note.updatedAvatarUrl || note.createdAvatarUrl || '';
  return `
    <article class="work-note-card ${note.pinned ? 'is-pinned' : ''}" onclick="workspaceOpenNote('${esc(note.id)}')">
      <div>
        <div class="work-note-meta">
          <span>${esc(noteTypeLabel(note.type))}</span>
          ${note.pinned ? '<span><i data-lucide="pin" class="icon"></i> закреплено</span>' : ''}
          ${noteFiles(note).length ? `<span><i data-lucide="paperclip" class="icon"></i> ${noteFiles(note).length}</span>` : ''}
        </div>
        <h3>${esc(note.title || 'Новая заметка')}</h3>
        <p>${notePreview(note)}</p>
      </div>
      <div class="work-author-line">
        ${avatarHtml(author, avatarUrl)}
        <small>изменил ${esc(author)} · ${esc(formatDate(note.updatedAt || note.createdAt))}</small>
      </div>
    </article>
  `;
}

function renderOverviewNoteCard(note) {
  const author = note.updatedBy || note.createdBy || 'участник';
  const avatarUrl = note.updatedAvatarUrl || note.createdAvatarUrl || '';
  return `
    <article class="work-note-card work-note-card-compact ${note.pinned ? 'is-pinned' : ''}" onclick="workspaceOpenNote('${esc(note.id)}')">
      <div class="work-note-compact-main">
        <div class="work-note-meta">
          <span>${esc(noteTypeLabel(note.type))}</span>
          ${note.pinned ? '<span><i data-lucide="pin" class="icon"></i> закреплено</span>' : ''}
          ${noteFiles(note).length ? `<span><i data-lucide="paperclip" class="icon"></i> ${noteFiles(note).length}</span>` : ''}
        </div>
        <h3>${esc(note.title || 'Новая заметка')}</h3>
        <p>${notePreview(note)}</p>
      </div>
      <div class="work-author-line work-author-line-compact">
        ${avatarHtml(author, avatarUrl)}
        <small>${esc(author)} · ${esc(formatDate(note.updatedAt || note.createdAt))}</small>
      </div>
    </article>
  `;
}

function renderOverview(root, data, workspace) {
  const pinnedLinks = data.links.filter(link => link.pinned).slice(0, 4);
  const pinnedNotes = sortNotes(data.notes).filter(note => note.pinned).slice(0, 4);
  const hasPinned = pinnedLinks.length || pinnedNotes.length;
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Рабочая зона проекта</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
      </div>

      ${renderWorkspaceTabs('overview', data)}

      <main class="workspace-area-main">
        ${!data.notes.length && !data.links.length ? renderQuickStart() : ''}
          ${hasPinned ? `
            <section class="workspace-card">
              <div class="workspace-card-head">
                <div>
                  <h2>Закреплённое</h2>
                  <p>Главные материалы проекта: заметки, папки, доски, макеты и документы.</p>
                </div>
              </div>
              <div class="work-link-grid">
                ${pinnedLinks.map(renderOverviewLinkCard).join('')}
                ${pinnedNotes.map(renderOverviewNoteCard).join('')}
              </div>
            </section>
          ` : ''}

          <section class="workspace-card">
            <div class="workspace-card-head">
              <div>
                <h2>Последние заметки</h2>
                <p>Короткие договорённости, идеи и рабочие материалы команды.</p>
              </div>
              <button class="btn-outline" onclick="workspaceSetView('notes')">Все заметки</button>
            </div>
            <div class="work-note-grid">
              ${sortNotes(data.notes).slice(0, 4).map(renderOverviewNoteCard).join('') || emptyState(
                'Заметок пока нет',
                'Создайте первую заметку: концепция проекта, вопросы подрядчикам или список решений.',
                '<button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Создать заметку</button>'
              )}
            </div>
          </section>
        </main>
    </section>
  `;
}

function renderNotes(root, data, workspace) {
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Заметки проекта</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
      </div>
      ${renderWorkspaceTabs('notes', data)}
      <section class="workspace-action-panel">
        <div>
          <strong>Заметки</strong>
          <span>Фиксируйте идеи, решения, вопросы и договорённости команды.</span>
        </div>
        <button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Новая заметка</button>
      </section>
      <div class="work-note-grid work-note-grid-wide">
        ${sortNotes(data.notes).map(renderNoteCard).join('') || emptyState(
          'Заметок пока нет',
          'Добавьте концепцию, список вопросов или рабочие договорённости.',
          '<button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Создать заметку</button>'
        )}
      </div>
    </section>
  `;
}

function renderLinks(root, data, workspace) {
  const links = filterLinks(data.links);
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Полезные ссылки</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
      </div>
      ${renderWorkspaceTabs('links', data)}
      <section class="workspace-action-panel">
        <div>
          <strong>Ссылки</strong>
          <span>Добавляйте Google Drive, Miro, документы и другие материалы проекта.</span>
        </div>
        <button class="btn-primary" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Добавить ссылку</button>
      </section>
      ${renderLinkControls(data)}
      <div class="work-link-grid">
        ${links.map(renderLinkCard).join('') || emptyState(
          data.links.length ? 'Ничего не найдено' : 'Ссылок пока нет',
          data.links.length ? 'Проверьте поиск или выберите другой фильтр.' : 'Добавьте Google Drive, Miro, Figma, таблицы или другие материалы проекта.',
          '<button class="btn-primary" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Добавить ссылку</button>'
        )}
      </div>
      ${renderLinkModal()}
    </section>
  `;
}

function renderNoteSidebar(notes, activeId) {
  return `
    <aside class="workspace-note-sidebar">
      <div class="workspace-note-sidebar-head">
        <strong>Заметки</strong>
        <button class="btn-outline work-mini-btn" onclick="workspaceNewNote()" title="Новая заметка"><i data-lucide="plus" class="icon"></i></button>
      </div>
      <div class="workspace-note-sidebar-list">
        ${notes.map(item => `
          <button class="${item.id === activeId ? 'active' : ''}" onclick="workspaceOpenNote('${esc(item.id)}')">
            <span>${item.pinned ? '<i data-lucide="pin" class="icon"></i>' : ''}${esc(item.title || 'Без названия')}</span>
            <small>${esc(noteTypeLabel(item.type))} · ${esc(formatDate(item.updatedAt || item.createdAt))}</small>
          </button>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderNoteView(root, data, workspace, noteId) {
  const note = data.notes.find(item => item.id === noteId);
  if (!note) {
    window.workspaceSetView('notes');
    return;
  }
  const safeBody = cleanEditorHtml(note.body || '') || '<p>Пока нет текста</p>';
  const notes = sortNotes(data.notes);
  const author = note.updatedBy || note.createdBy || 'участник';
  const avatarUrl = note.updatedAvatarUrl || note.createdAvatarUrl || '';
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>${esc(note.title || 'Заметка')}</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
        <div class="workspace-page-actions">
          <button class="btn-outline" onclick="workspaceSetView('notes')"><i data-lucide="arrow-left" class="icon"></i> К заметкам</button>
          <button class="btn-primary" onclick="workspaceEditNote('${esc(note.id)}')"><i data-lucide="pencil" class="icon"></i> Редактировать</button>
        </div>
      </div>

      <div class="workspace-editor-layout">
        ${renderNoteSidebar(notes, note.id)}

        <article class="workspace-editor-card workspace-note-view-card">
          <div class="workspace-note-info">
            <div class="work-author-line">
              ${avatarHtml(author, avatarUrl)}
              <small>изменил ${esc(author)} · ${esc(formatDate(note.updatedAt || note.createdAt))}</small>
            </div>
            <div class="work-note-meta">
              <span>${esc(noteTypeLabel(note.type))}</span>
              ${note.pinned ? '<span><i data-lucide="pin" class="icon"></i> закреплено</span>' : ''}
            </div>
          </div>
          <div class="workspace-note-view-body">${safeBody}</div>
          ${renderNoteFiles(note, false)}
        </article>
      </div>
    </section>
  `;
}

function renderEditor(root, data, workspace, noteId) {
  const note = data.notes.find(item => item.id === noteId);
  if (!note) {
    window.workspaceSetView('notes');
    return;
  }
  const safeBody = cleanEditorHtml(note.body || '') || '<p></p>';
  const notes = sortNotes(data.notes);
  const author = note.updatedBy || note.createdBy || 'участник';
  const avatarUrl = note.updatedAvatarUrl || note.createdAvatarUrl || '';
  root.innerHTML = `
    <section class="workspace-page workspace-editor-page">
      <div class="workspace-page-head">
        <div>
          <h1>Редактор заметки</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
        <div class="workspace-page-actions">
          <span class="workspace-save-status" id="workspace-note-save-status" data-mode="muted">Сохранено</span>
          <button class="btn-outline" onclick="workspaceBackToNotes('${esc(note.id)}')"><i data-lucide="arrow-left" class="icon"></i> К заметкам</button>
          <button class="btn-outline danger" onclick="workspaceDeleteNote('${esc(note.id)}')"><i data-lucide="trash-2" class="icon"></i> Удалить</button>
          <button class="btn-primary" onclick="workspaceSaveNote('${esc(note.id)}')"><i data-lucide="save" class="icon"></i> Сохранить</button>
        </div>
      </div>

      <div class="workspace-editor-layout">
        ${renderNoteSidebar(notes, note.id)}

        <div class="workspace-editor-card">
          <div class="workspace-note-info">
            <div class="work-author-line">
              ${avatarHtml(author, avatarUrl)}
              <small>изменил ${esc(author)} · ${esc(formatDate(note.updatedAt || note.createdAt))}</small>
            </div>
            <button class="btn-outline workspace-pin-btn ${note.pinned ? 'active' : ''}" onclick="workspaceTogglePinNote('${esc(note.id)}')" title="${note.pinned ? 'Открепить заметку' : 'Закрепить заметку'}">
              <i data-lucide="pin" class="icon"></i> ${note.pinned ? 'Закреплена' : 'Закрепить'}
            </button>
          </div>

          <div class="workspace-note-fields">
            <label class="workspace-editor-title">
              <span>Название</span>
              <input id="workspace-note-title" value="${esc(note.title || '')}" placeholder="Например: Концепция кофейни">
            </label>
            <label class="workspace-editor-title workspace-note-type-field">
              <span>Тип</span>
              <select id="workspace-note-type">${renderNoteTypeOptions(note.type || 'idea')}</select>
            </label>
          </div>

          <div class="workspace-editor-toolbar" aria-label="Инструменты заметки">
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="undo" onclick="workspaceFormat('undo')" title="Отменить"><i data-lucide="undo-2" class="icon"></i></button>
              <button data-workspace-tool="redo" onclick="workspaceFormat('redo')" title="Повторить"><i data-lucide="redo-2" class="icon"></i></button>
            </div>
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="bold" onclick="workspaceFormat('bold')" title="Жирный · Ctrl/Cmd+B"><b>B</b></button>
              <button data-workspace-tool="italic" onclick="workspaceFormat('italic')" title="Курсив · Ctrl/Cmd+I"><i>I</i></button>
              <button data-workspace-tool="link" onclick="workspaceOpenLinkPanel()" title="Вставить ссылку · Ctrl/Cmd+K"><i data-lucide="link" class="icon"></i></button>
            </div>
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="h2" onclick="workspaceFormatBlock('h2')" title="Заголовок · Ctrl/Cmd+Alt+2">H2</button>
              <button data-workspace-tool="blockquote" onclick="workspaceFormatBlock('blockquote')" title="Цитата · Ctrl/Cmd+Shift+."><i data-lucide="quote" class="icon"></i></button>
              <button data-workspace-tool="divider" onclick="workspaceInsertDivider()" title="Разделитель · Ctrl/Cmd+Shift+-"><i data-lucide="minus" class="icon"></i></button>
            </div>
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="image" onclick="workspaceInsertImage()" title="Изображение по ссылке"><i data-lucide="image" class="icon"></i></button>
            </div>
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="bulletList" onclick="workspaceFormat('insertUnorderedList')" title="Маркированный список · Ctrl/Cmd+Shift+8"><i data-lucide="list" class="icon"></i></button>
              <button data-workspace-tool="orderedList" onclick="workspaceFormat('insertOrderedList')" title="Нумерованный список · Ctrl/Cmd+Shift+7"><i data-lucide="list-ordered" class="icon"></i></button>
              <button data-workspace-tool="taskList" onclick="workspaceInsertChecklist()" title="Чеклист · Ctrl/Cmd+Shift+9"><i data-lucide="list-checks" class="icon"></i></button>
            </div>
            <div class="workspace-toolbar-group">
              <button data-workspace-tool="clear" onclick="workspaceFormat('removeFormat')" title="Очистить формат · Ctrl/Cmd+\\"><i data-lucide="eraser" class="icon"></i></button>
            </div>
          </div>

          <div class="workspace-link-panel" id="workspace-link-panel" style="display:none">
            <label>
              <span>Текст ссылки</span>
              <input id="workspace-link-text" placeholder="Например: Google Drive">
            </label>
            <label>
              <span>URL</span>
              <input id="workspace-link-url" placeholder="https://">
            </label>
            <button class="btn-primary" onclick="workspaceApplyEditorLink()"><i data-lucide="link" class="icon"></i> Вставить</button>
          </div>

          <div class="workspace-editor-wrap">
            <div id="workspace-note-body" class="workspace-editor-body" spellcheck="true"></div>
          </div>
          ${renderNoteFiles(note, true)}
        </div>
      </div>
    </section>
  `;
  setupEditor(note.id);
}

export function renderWorkspace(view = window._workspaceView || 'overview') {
  const root = document.getElementById('tab-workspace');
  if (!root) return;
  const data = area();
  const workspace = getCurrentWorkspace?.();
  window._workspaceView = view || 'overview';
  if (!String(view).startsWith('note-edit:')) cleanupEmptyDraftNotes(data);
  if (!String(view).startsWith('note-edit:')) clearEditorRuntime();
  if (view === 'notes') renderNotes(root, data, workspace);
  else if (view === 'links') renderLinks(root, data, workspace);
  else if (String(view).startsWith('note-edit:')) renderEditor(root, data, workspace, String(view).slice(10));
  else if (String(view).startsWith('note:')) renderNoteView(root, data, workspace, String(view).slice(5));
  else renderOverview(root, data, workspace);
  if (window.lucide) window.lucide.createIcons();
}

export async function workspaceSetView(view) {
  if (!(await ensureNoteCanLeave())) return;
  renderWorkspace(view || 'overview');
}

export async function workspaceNewNote(defaultTitle = 'Новая заметка') {
  if (!(await ensureNoteCanLeave())) return;
  const data = area();
  const actor = actorMeta();
  const note = {
    id: nextId('note'),
    title: defaultTitle || 'Новая заметка',
    body: '<p></p>',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: actor.name,
    updatedBy: actor.name,
    createdAvatarUrl: actor.avatarUrl,
    updatedAvatarUrl: actor.avatarUrl,
    type: defaultTitle === 'Концепция проекта' ? 'task' : 'idea',
    pinned: false,
    draft: true,
  };
  data.notes.unshift(note);
  renderWorkspace(`note-edit:${note.id}`);
}

export async function workspaceBackToNotes(id) {
  if (discardDraftNote(id, true)) {
    renderWorkspace('notes');
    return;
  }
  await workspaceSetView('notes');
}

export async function workspaceDeleteNote(id) {
  const data = area();
  const note = data.notes.find(item => item.id === id);
  if (!note) return;
  const ok = await window.showConfirm?.(`Удалить заметку «${note.title || 'Без названия'}»?`, null, { icon: '📝', okText: 'Удалить', danger: true });
  if (!ok) return;
  data.notes = data.notes.filter(item => item.id !== id);
  S.workspaceArea.notes = data.notes;
  saveState();
  window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', id, `Удалена заметка «${note.title || 'Без названия'}»`);
  renderWorkspace('notes');
}

export async function workspaceOpenNote(id) {
  if (!(await ensureNoteCanLeave(`view:${id}`))) return;
  renderWorkspace(`note:${id}`);
}

export async function workspaceEditNote(id) {
  if (!(await ensureNoteCanLeave(id))) return;
  renderWorkspace(`note-edit:${id}`);
}

export async function workspaceUploadNoteFile(noteId, file) {
  if (!file) return;
  const validationError = validateWorkspaceUploadFile(file);
  if (validationError) {
    window.showAlert?.(validationError);
    return;
  }
  const data = area();
  const note = data.notes.find(item => item.id === noteId);
  if (!note) return;
  try {
    const uploaded = await uploadWorkspaceFile(file, noteId);
    if (!uploaded?.id) throw new Error('Не удалось загрузить файл');
    const files = noteFiles(note);
    files.push(uploaded);
    note.updatedAt = nowIso();
    const actor = actorMeta();
    note.updatedBy = actor.name;
    note.updatedAvatarUrl = actor.avatarUrl;
    saveState();
    window.showToast?.('Файл прикреплён');
    renderWorkspace(window._workspaceView || `note-edit:${noteId}`);
  } catch (e) {
    window.showAlert?.(e?.message || 'Не удалось загрузить файл');
  }
}

export async function workspaceOpenNoteFile(noteId, fileId) {
  const data = area();
  const note = data.notes.find(item => item.id === noteId);
  const file = noteFiles(note || {}).find(item => String(item.id) === String(fileId));
  if (!file) return;
  try {
    const blob = await fetchWorkspaceFileBlob(file.id);
    if (shouldPreviewBlob(file, blob)) {
      if (_filePreview?.url) URL.revokeObjectURL(_filePreview.url);
      _filePreview = { url: URL.createObjectURL(blob), name: file.name || 'Изображение' };
      renderWorkspace(window._workspaceView || `note:${noteId}`);
    } else {
      downloadBlob(blob, file.name || 'file');
    }
  } catch (e) {
    window.showAlert?.(e?.message || 'Не удалось открыть файл');
  }
}

export function workspaceCloseFilePreview() {
  if (_filePreview?.url) URL.revokeObjectURL(_filePreview.url);
  _filePreview = null;
  renderWorkspace(window._workspaceView || 'notes');
}

export async function workspaceDeleteNoteFile(noteId, fileId) {
  const data = area();
  const note = data.notes.find(item => item.id === noteId);
  const file = noteFiles(note || {}).find(item => String(item.id) === String(fileId));
  if (!note || !file) return;
  const ok = await window.showConfirm?.(`Удалить файл «${file.name || 'Файл'}»?`, null, { icon: '📎', okText: 'Удалить', danger: true });
  if (!ok) return;
  try {
    await deleteWorkspaceFile(file.id);
    note.files = noteFiles(note).filter(item => String(item.id) !== String(fileId));
    note.updatedAt = nowIso();
    const actor = actorMeta();
    note.updatedBy = actor.name;
    note.updatedAvatarUrl = actor.avatarUrl;
    saveState();
    window.showToast?.('Файл удалён');
    renderWorkspace(window._workspaceView || `note-edit:${noteId}`);
  } catch (e) {
    window.showAlert?.(e?.message || 'Не удалось удалить файл');
  }
}

export function workspaceFormat(command) {
  if (!_tiptapEditor) return;
  const chain = _tiptapEditor.chain().focus();
  if (command === 'bold') chain.toggleBold().run();
  else if (command === 'italic') chain.toggleItalic().run();
  else if (command === 'insertUnorderedList') chain.toggleBulletList().run();
  else if (command === 'insertOrderedList') chain.toggleOrderedList().run();
  else if (command === 'taskList') chain.toggleTaskList().run();
  else if (command === 'undo') chain.undo().run();
  else if (command === 'redo') chain.redo().run();
  else if (command === 'removeFormat') chain.unsetAllMarks().clearNodes().run();
  updateToolbarState();
  markNoteDirty();
}

export function workspaceFormatBlock(tagName) {
  if (!_tiptapEditor) return;
  const chain = _tiptapEditor.chain().focus();
  if (tagName === 'h2') chain.toggleHeading({ level: 2 }).run();
  else if (tagName === 'h3') chain.toggleHeading({ level: 3 }).run();
  else if (tagName === 'blockquote') chain.toggleBlockquote().run();
  else chain.setParagraph().run();
  updateToolbarState();
  markNoteDirty();
}

export function workspaceInsertChecklist() {
  if (!_tiptapEditor) return;
  _tiptapEditor.chain().focus().toggleTaskList().run();
  updateToolbarState();
  markNoteDirty();
}

export function workspaceInsertDivider() {
  if (!_tiptapEditor) return;
  _tiptapEditor.chain().focus().setHorizontalRule().run();
  updateToolbarState();
  markNoteDirty();
}

export async function workspaceInsertImage() {
  if (!_tiptapEditor) return;
  const value = await window.showPrompt?.('Ссылка на изображение', 'https://', { okText: 'Вставить' });
  const src = normalizeUrl(value || '');
  if (!value) return;
  if (!/^https?:\/\//i.test(src)) {
    window.showAlert?.('Введите корректную ссылку на изображение');
    return;
  }
  _tiptapEditor.chain().focus().setImage({ src, alt: 'Изображение' }).run();
  updateToolbarState();
  markNoteDirty();
}

export function workspaceOpenLinkPanel() {
  const panel = document.getElementById('workspace-link-panel');
  if (!panel || !_tiptapEditor) return;
  const { from, to } = _tiptapEditor.state.selection;
  const selection = from !== to ? _tiptapEditor.state.doc.textBetween(from, to, ' ') : '';
  _savedEditorRange = from !== to ? { from, to } : null;
  const textInput = document.getElementById('workspace-link-text');
  const urlInput = document.getElementById('workspace-link-url');
  if (textInput && !textInput.value) textInput.value = selection;
  if (urlInput && !urlInput.value) urlInput.value = 'https://';
  panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
  setTimeout(() => (selection ? urlInput : textInput)?.focus(), 20);
}

export function workspaceApplyEditorLink() {
  if (!_tiptapEditor) return;
  const textInput = document.getElementById('workspace-link-text');
  const urlInput = document.getElementById('workspace-link-url');
  const text = (textInput?.value || '').trim();
  const url = normalizeUrl(urlInput?.value || '');
  if (!/^https?:\/\//i.test(url)) {
    window.showAlert?.('Введите корректную ссылку');
    return;
  }
  const range = _savedEditorRange || _tiptapEditor.state.selection;
  const selectedText = range?.from !== range?.to ? _tiptapEditor.state.doc.textBetween(range.from, range.to, ' ') : '';
  if (range?.from !== range?.to && text && text !== selectedText) {
    _tiptapEditor.chain().focus().insertContentAt(range, `<a href="${esc(url)}">${esc(text)}</a>`).run();
  } else if (range?.from !== range?.to) {
    _tiptapEditor.chain().focus().setTextSelection(range).setLink({ href: url }).run();
  } else {
    _tiptapEditor.chain().focus().insertContent(`<a href="${esc(url)}">${esc(text || url)}</a>`).run();
  }
  if (textInput) textInput.value = '';
  if (urlInput) urlInput.value = '';
  const panel = document.getElementById('workspace-link-panel');
  if (panel) panel.style.display = 'none';
  _savedEditorRange = null;
  updateToolbarState();
  markNoteDirty();
}

export function workspaceSaveNote(id, options = {}) {
  const data = area();
  const note = data.notes.find(item => item.id === id);
  if (!note) return;
  const actor = actorMeta();
  const titleInput = document.getElementById('workspace-note-title');
  const bodyInput = document.getElementById('workspace-note-body');
  const typeInput = document.getElementById('workspace-note-type');
  if (!titleInput || !bodyInput || !typeInput) return false;
  if (_activeEditorNoteId === id && !_tiptapEditor) {
    setEditorStatus('Редактор загружается...', 'saving');
    return false;
  }
  const title = titleInput.value?.trim() || 'Без названия';
  const body = cleanEditorHtml((_tiptapEditor && _activeEditorNoteId === id) ? _tiptapEditor.getHTML() : (bodyInput.innerHTML || ''));
  const type = typeInput.value || 'idea';
  if (!stripHtml(body).trim()) {
    setEditorStatus('Добавьте текст заметки', 'error');
    if (options.log !== false) window.showAlert?.('Добавьте текст заметки перед сохранением');
    return false;
  }
  note.title = title;
  note.body = body || '<p></p>';
  note.type = NOTE_TYPES.some(([key]) => key === type) ? type : 'idea';
  note.updatedAt = nowIso();
  note.updatedBy = actor.name;
  note.updatedAvatarUrl = actor.avatarUrl;
  note.draft = false;
  saveState();
  if (options.log !== false) {
    window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', id, `Изменена заметка «${title}»`);
  }
  _noteDirty = false;
  clearTimeout(_noteAutosaveTimer);
  setEditorStatus('Сохранено', 'saved');
  updateEditorPlaceholder();
  return true;
}

export async function workspaceNewLink(defaultTitle = 'Google Drive') {
  _linkModal = {
    mode: 'new',
    title: defaultTitle || '',
    url: defaultTitle === 'Google Drive' ? 'https://drive.google.com/' : defaultTitle === 'Miro' ? 'https://miro.com/' : 'https://',
  };
  renderWorkspace('links');
}

function guessLinkType(url) {
  const host = linkHost(url);
  if (host.includes('drive.google')) return 'drive';
  if (host.includes('docs.google')) {
    if (String(url).includes('/spreadsheets/')) return 'sheet';
    return 'doc';
  }
  if (host.includes('miro')) return 'miro';
  if (host.includes('figma')) return 'figma';
  if (host.includes('notion')) return 'notion';
  if (host.includes('t.me') || host.includes('telegram')) return 'telegram';
  if (host) return 'site';
  return 'other';
}

export async function workspaceEditLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  if (!link) return;
  _linkModal = { mode: 'edit', id };
  renderWorkspace('links');
}

export function workspaceViewLink(id) {
  const data = area();
  if (!data.links.some(item => item.id === id)) return;
  _linkModal = { mode: 'view', id };
  renderWorkspace('links');
}

export function workspaceCloseLinkModal() {
  _linkModal = null;
  renderWorkspace('links');
}

export function workspaceAutofillLinkType() {
  const urlInput = document.getElementById('workspace-project-link-url');
  const typeInput = document.getElementById('workspace-project-link-type');
  if (!urlInput || !typeInput) return;
  typeInput.value = guessLinkType(normalizeUrl(urlInput.value));
}

export function workspaceSetLinkFilter(filter) {
  const allowed = new Set(['all', 'pinned', ...LINK_TYPES.map(([key]) => key)]);
  _linkFilter = allowed.has(filter) ? filter : 'all';
  renderWorkspace('links');
}

export function workspaceSetLinkSearch(query) {
  _linkSearch = String(query || '').slice(0, 120);
  renderWorkspace('links');
}

export function workspaceSaveProjectLink(id = '') {
  const urlInput = document.getElementById('workspace-project-link-url');
  const titleInput = document.getElementById('workspace-project-link-title');
  const typeInput = document.getElementById('workspace-project-link-type');
  const descInput = document.getElementById('workspace-project-link-description');
  const pinnedInput = document.getElementById('workspace-project-link-pinned');
  const normalizedUrl = normalizeUrl(urlInput?.value || '');
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    window.showAlert?.('Введите корректную ссылку');
    return;
  }
  const data = area();
  const duplicate = data.links.find(item => item.id !== id && normalizeUrl(item.url) === normalizedUrl);
  if (duplicate) {
    window.showAlert?.(`Эта ссылка уже есть в проекте: «${duplicate.title || linkHost(normalizedUrl) || 'Ссылка'}»`);
    return;
  }
  const actor = actorMeta();
  const type = LINK_TYPES.some(([key]) => key === typeInput?.value) ? typeInput.value : guessLinkType(normalizedUrl);
  const payload = {
    title: String(titleInput?.value || '').trim() || linkHost(normalizedUrl) || 'Ссылка',
    url: normalizedUrl,
    type,
    description: String(descInput?.value || '').trim(),
    pinned: !!pinnedInput?.checked,
    updatedAt: nowIso(),
    updatedBy: actor.name,
    updatedAvatarUrl: actor.avatarUrl,
  };
  let link = data.links.find(item => item.id === id);
  if (link) {
    Object.assign(link, payload);
  } else {
    link = {
      id: nextId('link'),
      ...payload,
      createdAt: nowIso(),
      createdBy: actor.name,
      createdAvatarUrl: actor.avatarUrl,
    };
    data.links.unshift(link);
  }
  saveState();
  window.logWorkspaceActivity?.('workspace_link_changed', 'workspace_link', link.id, `${id ? 'Изменена' : 'Добавлена'} ссылка «${link.title}»`);
  _linkModal = null;
  renderWorkspace('links');
}

export function workspaceOpenProjectLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  const url = normalizeUrl(link?.url || '');
  if (!/^https?:\/\//i.test(url)) return;
  window.open(url, '_blank', 'noopener');
}

export async function workspaceCopyLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  const url = normalizeUrl(link?.url || '');
  if (!url) return;
  try {
    await navigator.clipboard?.writeText(url);
    if (window.showToast) window.showToast('Ссылка скопирована');
    else window.showAlert?.('Ссылка скопирована');
  } catch {
    window.showAlert?.(url);
  }
}

export async function workspaceDeleteLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  if (!link) return;
  const ok = await window.showConfirm?.(`Удалить ссылку «${link.title || 'Ссылка'}»?`, null, { icon: '🔗', okText: 'Удалить', danger: true });
  if (!ok) return;
  data.links = data.links.filter(item => item.id !== id);
  S.workspaceArea.links = data.links;
  saveState();
  window.logWorkspaceActivity?.('workspace_link_changed', 'workspace_link', id, `Удалена ссылка «${link.title || 'Ссылка'}»`);
  renderWorkspace('links');
}

export function workspaceTogglePinLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  if (!link) return;
  link.pinned = !link.pinned;
  link.updatedAt = nowIso();
  saveState();
  window.logWorkspaceActivity?.('workspace_link_changed', 'workspace_link', id, `${link.pinned ? 'Закреплена' : 'Откреплена'} ссылка «${link.title || 'Ссылка'}»`);
  renderWorkspace(window._workspaceView || 'links');
}

export function workspaceTogglePinNote(id) {
  const data = area();
  const note = data.notes.find(item => item.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = nowIso();
  const actor = actorMeta();
  note.updatedBy = actor.name;
  note.updatedAvatarUrl = actor.avatarUrl;
  saveState();
  window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', id, `${note.pinned ? 'Закреплена' : 'Откреплена'} заметка «${note.title || 'Без названия'}»`);
  _noteDirty = false;
  renderWorkspace(`note:${id}`);
}

async function setupEditor(noteId) {
  if (_tiptapEditor) {
    _tiptapEditor.destroy();
    _tiptapEditor = null;
  }
  _activeEditorNoteId = noteId;
  _noteDirty = false;
  clearTimeout(_noteAutosaveTimer);
  const note = area().notes.find(item => item.id === noteId);
  const title = document.getElementById('workspace-note-title');
  const type = document.getElementById('workspace-note-type');
  const body = document.getElementById('workspace-note-body');
  const linkText = document.getElementById('workspace-link-text');
  const linkUrl = document.getElementById('workspace-link-url');
  [title, type, body].forEach(el => {
    el?.addEventListener('input', markNoteDirty);
    el?.addEventListener('change', markNoteDirty);
  });
  [title, type, body].forEach(el => {
    el?.addEventListener('keydown', handleEditorShortcut);
  });
  [linkText, linkUrl].forEach(el => {
    el?.addEventListener('keydown', handleLinkPanelShortcut);
  });
  if (body) body.innerHTML = '<div class="workspace-editor-loading">Загружаем редактор...</div>';
  window.onbeforeunload = () => _noteDirty ? 'Есть несохранённые изменения в заметке.' : null;
  try {
    const { Editor, StarterKit, Link, Placeholder, TaskList, TaskItem, Image, Typography } = await loadTiptapModules();
    if (_activeEditorNoteId !== noteId) return;
    const currentBody = document.getElementById('workspace-note-body');
    if (!currentBody) return;
    currentBody.innerHTML = '';
    _tiptapEditor = new Editor({
      element: currentBody,
      content: cleanEditorHtml(note?.body || '') || '<p></p>',
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener',
          },
        }),
        Placeholder.configure({
          placeholder: 'Опишите договорённости, идеи, вопросы или ссылки по запуску проекта...',
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Typography,
      ],
      editorProps: {
        attributes: {
          class: 'workspace-tiptap-content',
          spellcheck: 'true',
        },
        transformPastedHTML(html) {
          return cleanEditorHtml(html);
        },
      },
      onUpdate: () => {
        updateToolbarState();
        markNoteDirty();
      },
      onSelectionUpdate: () => updateToolbarState(),
      onTransaction: () => updateToolbarState(),
    });
    updateEditorPlaceholder();
    updateToolbarState();
  } catch (e) {
    console.error('[workspace] tiptap init failed', e);
    if (body) body.innerHTML = '<div class="workspace-editor-loading is-error">Не удалось загрузить редактор. Обновите страницу.</div>';
  }
}

function handleEditorShortcut(event) {
  const primary = event.metaKey || event.ctrlKey;
  const key = String(event.key || '').toLowerCase();
  const code = event.code || '';
  const body = document.getElementById('workspace-note-body');
  const inBody = event.currentTarget === body;
  const save = () => {
    if (_activeEditorNoteId) workspaceSaveNote(_activeEditorNoteId);
  };
  if (!primary && key === 'escape') {
    closeLinkPanel();
      return;
  }
  if (event.defaultPrevented) return;
  if (!primary) return;
  if (key === 's') {
    event.preventDefault();
    save();
    return;
  }
  if (!inBody) return;
  const run = fn => {
    event.preventDefault();
    fn();
  };
  if (!event.shiftKey && !event.altKey && key === 'b') return run(() => workspaceFormat('bold'));
  if (!event.shiftKey && !event.altKey && key === 'i') return run(() => workspaceFormat('italic'));
  if (!event.shiftKey && !event.altKey && key === 'k') return run(workspaceOpenLinkPanel);
  if (event.altKey && (code === 'Digit2' || key === '2')) return run(() => workspaceFormatBlock('h2'));
  if (event.shiftKey && (code === 'Digit7' || key === '7' || key === '&')) return run(() => workspaceFormat('insertOrderedList'));
  if (event.shiftKey && (code === 'Digit8' || key === '8' || key === '*')) return run(() => workspaceFormat('insertUnorderedList'));
  if (event.shiftKey && (code === 'Digit9' || key === '9' || key === '(')) return run(() => workspaceFormat('taskList'));
  if (event.shiftKey && (code === 'Period' || key === '.')) return run(() => workspaceFormatBlock('blockquote'));
  if (event.shiftKey && (code === 'Minus' || key === '-' || key === '_')) return run(workspaceInsertDivider);
  if (!event.shiftKey && !event.altKey && (code === 'Backslash' || key === '\\')) return run(() => workspaceFormat('removeFormat'));
}

function handleLinkPanelShortcut(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeLinkPanel();
    document.getElementById('workspace-note-body')?.focus();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    workspaceApplyEditorLink();
  }
}

function updateToolbarState() {
  if (!_tiptapEditor) return;
  const setActive = (tool, active) => {
    document.querySelectorAll(`[data-workspace-tool="${tool}"]`).forEach(btn => btn.classList.toggle('active', !!active));
  };
  const setDisabled = (tool, disabled) => {
    document.querySelectorAll(`[data-workspace-tool="${tool}"]`).forEach(btn => {
      btn.disabled = !!disabled;
      btn.classList.toggle('disabled', !!disabled);
    });
  };
  setActive('bold', _tiptapEditor.isActive('bold'));
  setActive('italic', _tiptapEditor.isActive('italic'));
  setActive('link', _tiptapEditor.isActive('link'));
  setActive('h2', _tiptapEditor.isActive('heading', { level: 2 }));
  setActive('blockquote', _tiptapEditor.isActive('blockquote'));
  setActive('bulletList', _tiptapEditor.isActive('bulletList'));
  setActive('orderedList', _tiptapEditor.isActive('orderedList'));
  setActive('taskList', _tiptapEditor.isActive('taskList'));
  setDisabled('undo', !_tiptapEditor.can().undo());
  setDisabled('redo', !_tiptapEditor.can().redo());
}

function closeLinkPanel() {
  const panel = document.getElementById('workspace-link-panel');
  if (panel) panel.style.display = 'none';
  _savedEditorRange = null;
}

function clearEditorRuntime() {
  if (_tiptapEditor) {
    _tiptapEditor.destroy();
    _tiptapEditor = null;
  }
  _activeEditorNoteId = null;
  _noteDirty = false;
  clearTimeout(_noteAutosaveTimer);
  _savedEditorRange = null;
  window.onbeforeunload = null;
}

function markNoteDirty() {
  if (!_activeEditorNoteId) return;
  _noteDirty = true;
  setEditorStatus('Сохраняем...', 'saving');
  updateEditorPlaceholder();
  clearTimeout(_noteAutosaveTimer);
  _noteAutosaveTimer = setTimeout(() => {
    if (_activeEditorNoteId) workspaceSaveNote(_activeEditorNoteId, { log: false });
  }, 1200);
}

async function ensureNoteCanLeave(nextId = '') {
  if (!_noteDirty || !_activeEditorNoteId || nextId === _activeEditorNoteId) return true;
  if (discardDraftNote(_activeEditorNoteId, true)) return true;
  const ok = await window.showConfirm?.('Есть несохранённые изменения в заметке. Сохранить перед переходом?', null, { icon: '💾', okText: 'Сохранить', danger: false });
  if (!ok) return false;
  if (!workspaceSaveNote(_activeEditorNoteId, { log: false })) return false;
  _noteDirty = false;
  return true;
}

export function workspaceFlushNoteAutosave() {
  if (!_noteDirty || !_activeEditorNoteId) return true;
  return !!workspaceSaveNote(_activeEditorNoteId, { log: false });
}

export function workspaceHasUnsavedNote() {
  return !!_noteDirty;
}

function updateEditorPlaceholder() {
  const body = document.getElementById('workspace-note-body');
  if (!body || !_tiptapEditor) return;
  body.classList.toggle('is-empty', _tiptapEditor.isEmpty);
}
