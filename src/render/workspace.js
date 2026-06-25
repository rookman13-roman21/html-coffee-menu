import { S, saveState } from '../state/store.js';
import { getCurrentWorkspace, getUser } from '../ui/auth.js';

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
let _linkFilter = 'all';
let _linkSearch = '';
let _linkModal = null;

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

function cleanEditorHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE', 'HR']);
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
  const filters = [
    ['all', 'Все', data.links.length],
    ['pinned', 'Закреплённые', data.links.filter(link => link.pinned).length],
    ...LINK_TYPES.map(([key, label]) => [key, label, data.links.filter(link => link.type === key).length]),
  ];
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

function renderNoteCard(note) {
  const author = note.updatedBy || note.createdBy || 'участник';
  const avatarUrl = note.updatedAvatarUrl || note.createdAvatarUrl || '';
  return `
    <article class="work-note-card ${note.pinned ? 'is-pinned' : ''}" onclick="workspaceOpenNote('${esc(note.id)}')">
      <div>
        <div class="work-note-meta">
          <span>${esc(noteTypeLabel(note.type))}</span>
          ${note.pinned ? '<span><i data-lucide="pin" class="icon"></i> закреплено</span>' : ''}
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

function renderOverview(root, data, workspace) {
  const pinned = data.links.filter(link => link.pinned).slice(0, 4);
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Рабочая зона проекта</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
        <div class="workspace-page-actions">
          <button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Новая заметка</button>
          <button class="btn-outline" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Добавить ссылку</button>
        </div>
      </div>

      ${renderWorkspaceTabs('overview', data)}

      <main class="workspace-area-main">
        ${!data.notes.length && !data.links.length ? renderQuickStart() : ''}
          <section class="workspace-card">
            <div class="workspace-card-head">
              <div>
                <h2>Закреплённое</h2>
                <p>Главные материалы проекта: папки, доски, макеты и документы.</p>
              </div>
              <button class="btn-outline" onclick="workspaceSetView('links')">Все ссылки</button>
            </div>
            <div class="work-link-grid">
              ${pinned.length ? pinned.map(renderLinkCard).join('') : emptyState(
                'Нет закреплённых ссылок',
                'Закрепите главную папку Google Drive, Miro-доску или макеты, чтобы команда быстро находила важные материалы.',
                '<button class="btn-outline" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Добавить первую ссылку</button>'
              )}
            </div>
          </section>

          <section class="workspace-card">
            <div class="workspace-card-head">
              <div>
                <h2>Последние заметки</h2>
                <p>Короткие договорённости, идеи и рабочие материалы команды.</p>
              </div>
              <button class="btn-outline" onclick="workspaceSetView('notes')">Все заметки</button>
            </div>
            <div class="work-note-grid">
              ${sortNotes(data.notes).slice(0, 4).map(renderNoteCard).join('') || emptyState(
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
        <div class="workspace-page-actions">
          <button class="btn-outline" onclick="workspaceSetView('overview')"><i data-lucide="arrow-left" class="icon"></i> Обзор</button>
          <button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Новая заметка</button>
        </div>
      </div>
      ${renderWorkspaceTabs('notes', data)}
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
        <div class="workspace-page-actions">
          <button class="btn-outline" onclick="workspaceSetView('overview')"><i data-lucide="arrow-left" class="icon"></i> Обзор</button>
          <button class="btn-primary" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Добавить ссылку</button>
        </div>
      </div>
      ${renderWorkspaceTabs('links', data)}
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
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Редактор заметки</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
        <div class="workspace-page-actions">
          <span class="workspace-save-status" id="workspace-note-save-status" data-mode="muted">Сохранено</span>
          <button class="btn-outline" onclick="workspaceSetView('notes')"><i data-lucide="arrow-left" class="icon"></i> К заметкам</button>
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
            <button class="btn-outline workspace-pin-btn ${note.pinned ? 'active' : ''}" onclick="workspaceTogglePinNote('${esc(note.id)}')">
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

          <div class="workspace-editor-toolbar">
            <button onclick="workspaceFormat('bold')" title="Жирный · Ctrl/Cmd+B"><b>B</b></button>
            <button onclick="workspaceFormat('italic')" title="Курсив · Ctrl/Cmd+I"><i>I</i></button>
            <button onclick="workspaceFormatBlock('h2')" title="Заголовок · Ctrl/Cmd+Alt+2">H2</button>
            <button onclick="workspaceFormat('insertUnorderedList')" title="Маркированный список · Ctrl/Cmd+Shift+8"><i data-lucide="list" class="icon"></i></button>
            <button onclick="workspaceFormat('insertOrderedList')" title="Нумерованный список · Ctrl/Cmd+Shift+7"><i data-lucide="list-ordered" class="icon"></i></button>
            <button onclick="workspaceInsertChecklist()" title="Чеклист · Ctrl/Cmd+Shift+9"><i data-lucide="list-checks" class="icon"></i></button>
            <button onclick="workspaceFormatBlock('blockquote')" title="Цитата · Ctrl/Cmd+Shift+."><i data-lucide="quote" class="icon"></i></button>
            <button onclick="workspaceInsertDivider()" title="Разделитель · Ctrl/Cmd+Shift+-"><i data-lucide="minus" class="icon"></i></button>
            <button onclick="workspaceOpenLinkPanel()" title="Вставить ссылку · Ctrl/Cmd+K"><i data-lucide="link" class="icon"></i></button>
            <button onclick="workspaceFormat('removeFormat')" title="Очистить формат · Ctrl/Cmd+\\"><i data-lucide="eraser" class="icon"></i></button>
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
            <div class="workspace-editor-placeholder">Опишите договорённости, идеи, вопросы или ссылки по запуску проекта...</div>
            <div id="workspace-note-body" class="workspace-editor-body" contenteditable="true" spellcheck="true">${safeBody}</div>
          </div>
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
  };
  data.notes.unshift(note);
  saveState();
  window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', note.id, `Создана заметка «${note.title}»`);
  renderWorkspace(`note-edit:${note.id}`);
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

export function workspaceFormat(command) {
  document.execCommand(command, false, null);
  markNoteDirty();
  document.getElementById('workspace-note-body')?.focus();
}

export function workspaceFormatBlock(tagName) {
  document.execCommand('formatBlock', false, tagName);
  markNoteDirty();
  document.getElementById('workspace-note-body')?.focus();
}

export function workspaceInsertChecklist() {
  document.execCommand('insertHTML', false, '<ul><li>☐ Новый пункт</li></ul>');
  markNoteDirty();
  document.getElementById('workspace-note-body')?.focus();
}

export function workspaceInsertDivider() {
  document.execCommand('insertHTML', false, '<hr><p><br></p>');
  markNoteDirty();
  document.getElementById('workspace-note-body')?.focus();
}

export function workspaceOpenLinkPanel() {
  const panel = document.getElementById('workspace-link-panel');
  if (!panel) return;
  const selectionObj = window.getSelection?.();
  const selection = selectionObj?.toString?.() || '';
  _savedEditorRange = selectionObj?.rangeCount ? selectionObj.getRangeAt(0).cloneRange() : null;
  const textInput = document.getElementById('workspace-link-text');
  const urlInput = document.getElementById('workspace-link-url');
  if (textInput && !textInput.value) textInput.value = selection;
  if (urlInput && !urlInput.value) urlInput.value = 'https://';
  panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
  setTimeout(() => (selection ? urlInput : textInput)?.focus(), 20);
}

export function workspaceApplyEditorLink() {
  const textInput = document.getElementById('workspace-link-text');
  const urlInput = document.getElementById('workspace-link-url');
  const text = (textInput?.value || '').trim();
  const url = normalizeUrl(urlInput?.value || '');
  if (!/^https?:\/\//i.test(url)) {
    window.showAlert?.('Введите корректную ссылку');
    return;
  }
  if (_savedEditorRange) {
    const selection = window.getSelection?.();
    selection?.removeAllRanges();
    selection?.addRange(_savedEditorRange);
  }
  const safeText = esc(text || url);
  document.execCommand('insertHTML', false, `<a href="${esc(url)}" target="_blank" rel="noopener">${safeText}</a>`);
  const editor = document.getElementById('workspace-note-body');
  editor?.querySelectorAll('a').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
  if (textInput) textInput.value = '';
  if (urlInput) urlInput.value = '';
  const panel = document.getElementById('workspace-link-panel');
  if (panel) panel.style.display = 'none';
  _savedEditorRange = null;
  markNoteDirty();
  editor?.focus();
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
  const title = titleInput.value?.trim() || 'Без названия';
  const body = cleanEditorHtml(bodyInput.innerHTML || '');
  const type = typeInput.value || 'idea';
  note.title = title;
  note.body = body || '<p></p>';
  note.type = NOTE_TYPES.some(([key]) => key === type) ? type : 'idea';
  note.updatedAt = nowIso();
  note.updatedBy = actor.name;
  note.updatedAvatarUrl = actor.avatarUrl;
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

function setupEditor(noteId) {
  _activeEditorNoteId = noteId;
  _noteDirty = false;
  clearTimeout(_noteAutosaveTimer);
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
  body?.addEventListener('paste', () => setTimeout(() => {
    if (body) body.innerHTML = cleanEditorHtml(body.innerHTML);
    markNoteDirty();
  }, 0));
  updateEditorPlaceholder();
  window.onbeforeunload = () => _noteDirty ? 'Есть несохранённые изменения в заметке.' : null;
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
  if (event.shiftKey && (code === 'Digit9' || key === '9' || key === '(')) return run(workspaceInsertChecklist);
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

function closeLinkPanel() {
  const panel = document.getElementById('workspace-link-panel');
  if (panel) panel.style.display = 'none';
  _savedEditorRange = null;
}

function clearEditorRuntime() {
  _activeEditorNoteId = null;
  _noteDirty = false;
  clearTimeout(_noteAutosaveTimer);
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
  const ok = await window.showConfirm?.('Есть несохранённые изменения в заметке. Сохранить перед переходом?', null, { icon: '💾', okText: 'Сохранить', danger: false });
  if (!ok) return false;
  workspaceSaveNote(_activeEditorNoteId, { log: false });
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
  const placeholder = document.querySelector('.workspace-editor-placeholder');
  if (!body || !placeholder) return;
  const isEmpty = !stripHtml(body.innerHTML).trim();
  placeholder.style.display = isEmpty ? 'block' : 'none';
}
