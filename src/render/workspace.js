import { S, saveState } from '../state/store.js';
import { getCurrentWorkspace, getUser } from '../ui/auth.js';

const LINK_TYPES = [
  ['drive', 'Google Drive'],
  ['miro', 'Miro'],
  ['figma', 'Figma'],
  ['notion', 'Notion'],
  ['sheet', 'Таблица'],
  ['doc', 'Документ'],
  ['other', 'Другое'],
];

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

function actorName() {
  const user = getUser?.();
  return user?.name || user?.email || 'Участник';
}

function nextId(prefix, list) {
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
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE']);
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

function renderLinkCard(link) {
  const url = normalizeUrl(link.url);
  return `
    <article class="work-link-card ${link.pinned ? 'is-pinned' : ''}">
      <div class="work-link-main">
        <div class="work-link-kicker">${esc(linkTypeLabel(link.type))}${link.pinned ? ' · закреплено' : ''}</div>
        <h3>${esc(link.title || linkHost(url) || 'Ссылка')}</h3>
        ${link.description ? `<p>${esc(link.description)}</p>` : ''}
        <a href="${esc(url)}" target="_blank" rel="noopener">${esc(linkHost(url) || url)}</a>
        <small>добавил ${esc(link.createdBy || 'участник')} · ${esc(formatDate(link.updatedAt || link.createdAt))}</small>
      </div>
      <div class="work-card-actions">
        <button class="btn-outline work-mini-btn" onclick="workspaceTogglePinLink('${esc(link.id)}')" title="Закрепить"><i data-lucide="${link.pinned ? 'pin-off' : 'pin'}" class="icon"></i></button>
        <button class="btn-outline work-mini-btn" onclick="workspaceEditLink('${esc(link.id)}')" title="Редактировать"><i data-lucide="pencil" class="icon"></i></button>
        <button class="btn-outline work-mini-btn danger" onclick="workspaceDeleteLink('${esc(link.id)}')" title="Удалить"><i data-lucide="trash-2" class="icon"></i></button>
      </div>
    </article>
  `;
}

function renderNoteCard(note) {
  return `
    <article class="work-note-card" onclick="workspaceOpenNote('${esc(note.id)}')">
      <div>
        <h3>${esc(note.title || 'Новая заметка')}</h3>
        <p>${notePreview(note)}</p>
      </div>
      <small>изменил ${esc(note.updatedBy || note.createdBy || 'участник')} · ${esc(formatDate(note.updatedAt || note.createdAt))}</small>
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
          <button class="btn-primary" onclick="workspaceNewNote()"><i data-lucide="file-plus-2" class="icon"></i> Заметка</button>
          <button class="btn-outline" onclick="workspaceNewLink()"><i data-lucide="link" class="icon"></i> Ссылка</button>
        </div>
      </div>

      <div class="workspace-area-grid">
        <aside class="workspace-area-side">
          <button class="active" onclick="workspaceSetView('overview')"><i data-lucide="layout-dashboard" class="icon"></i> Обзор</button>
          <button onclick="workspaceSetView('notes')"><i data-lucide="file-text" class="icon"></i> Заметки <span>${data.notes.length}</span></button>
          <button onclick="workspaceSetView('links')"><i data-lucide="link-2" class="icon"></i> Ссылки <span>${data.links.length}</span></button>
        </aside>

        <main class="workspace-area-main">
          <section class="workspace-card">
            <div class="workspace-card-head">
              <div>
                <h2>Закреплённое</h2>
                <p>Главные материалы проекта: папки, доски, макеты и документы.</p>
              </div>
              <button class="btn-outline" onclick="workspaceSetView('links')">Все ссылки</button>
            </div>
            <div class="work-link-grid">
              ${pinned.length ? pinned.map(renderLinkCard).join('') : `<div class="workspace-empty">Закрепите важные ссылки, чтобы команда быстро находила нужные материалы.</div>`}
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
              ${data.notes.slice(0, 4).map(renderNoteCard).join('') || `<div class="workspace-empty">Создайте первую заметку: концепция, вопросы подрядчикам или список решений.</div>`}
            </div>
          </section>
        </main>
      </div>
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
      <div class="work-note-grid work-note-grid-wide">
        ${data.notes.map(renderNoteCard).join('') || `<div class="workspace-empty">Заметок пока нет. Добавьте концепцию, список вопросов или рабочие договорённости.</div>`}
      </div>
    </section>
  `;
}

function renderLinks(root, data, workspace) {
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
      <div class="work-link-grid">
        ${data.links.map(renderLinkCard).join('') || `<div class="workspace-empty">Добавьте Google Drive, Miro, Figma, таблицы или другие материалы проекта.</div>`}
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
  root.innerHTML = `
    <section class="workspace-page">
      <div class="workspace-page-head">
        <div>
          <h1>Редактор заметки</h1>
          <p>${esc(workspace?.name || 'Проект кофейни')}</p>
        </div>
        <div class="workspace-page-actions">
          <button class="btn-outline" onclick="workspaceSetView('notes')"><i data-lucide="arrow-left" class="icon"></i> К заметкам</button>
          <button class="btn-outline danger" onclick="workspaceDeleteNote('${esc(note.id)}')"><i data-lucide="trash-2" class="icon"></i> Удалить</button>
          <button class="btn-primary" onclick="workspaceSaveNote('${esc(note.id)}')"><i data-lucide="save" class="icon"></i> Сохранить</button>
        </div>
      </div>
      <div class="workspace-editor-card">
        <label class="workspace-editor-title">
          <span>Название</span>
          <input id="workspace-note-title" value="${esc(note.title || '')}" placeholder="Например: Концепция кофейни">
        </label>
        <div class="workspace-editor-toolbar">
          <button onclick="workspaceFormat('bold')" title="Жирный"><b>B</b></button>
          <button onclick="workspaceFormat('italic')" title="Курсив"><i>I</i></button>
          <button onclick="workspaceFormat('insertUnorderedList')" title="Список"><i data-lucide="list" class="icon"></i></button>
          <button onclick="workspaceInsertLink()" title="Вставить ссылку"><i data-lucide="link" class="icon"></i></button>
        </div>
        <div id="workspace-note-body" class="workspace-editor-body" contenteditable="true" spellcheck="true">${safeBody}</div>
      </div>
    </section>
  `;
}

export function renderWorkspace(view = window._workspaceView || 'overview') {
  const root = document.getElementById('tab-workspace');
  if (!root) return;
  const data = area();
  const workspace = getCurrentWorkspace?.();
  window._workspaceView = view || 'overview';
  if (view === 'notes') renderNotes(root, data, workspace);
  else if (view === 'links') renderLinks(root, data, workspace);
  else if (String(view).startsWith('note:')) renderEditor(root, data, workspace, String(view).slice(5));
  else renderOverview(root, data, workspace);
  if (window.lucide) window.lucide.createIcons();
}

export function workspaceSetView(view) {
  renderWorkspace(view || 'overview');
}

export function workspaceNewNote() {
  const data = area();
  const note = {
    id: nextId('note', data.notes),
    title: 'Новая заметка',
    body: '<p></p>',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: actorName(),
    updatedBy: actorName(),
  };
  data.notes.unshift(note);
  saveState();
  window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', note.id, `Создана заметка «${note.title}»`);
  renderWorkspace(`note:${note.id}`);
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

export function workspaceOpenNote(id) {
  renderWorkspace(`note:${id}`);
}

export function workspaceFormat(command) {
  document.execCommand(command, false, null);
  document.getElementById('workspace-note-body')?.focus();
}

export async function workspaceInsertLink() {
  const entered = await window.showPrompt?.('Ссылка', 'https://', { icon: '🔗', okText: 'Вставить' });
  const url = normalizeUrl(entered || '');
  if (!url) return;
  document.execCommand('createLink', false, url);
  const editor = document.getElementById('workspace-note-body');
  editor?.querySelectorAll('a').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
  editor?.focus();
}

export function workspaceSaveNote(id) {
  const data = area();
  const note = data.notes.find(item => item.id === id);
  if (!note) return;
  const title = document.getElementById('workspace-note-title')?.value?.trim() || 'Без названия';
  const body = cleanEditorHtml(document.getElementById('workspace-note-body')?.innerHTML || '');
  note.title = title;
  note.body = body || '<p></p>';
  note.updatedAt = nowIso();
  note.updatedBy = actorName();
  saveState();
  window.logWorkspaceActivity?.('workspace_note_changed', 'workspace_note', id, `Изменена заметка «${title}»`);
  renderWorkspace(`note:${id}`);
}

export async function workspaceNewLink() {
  const title = await window.showPrompt?.('Название ссылки', 'Google Drive');
  if (title == null) return;
  const url = await window.showPrompt?.('URL ссылки', 'https://');
  if (url == null) return;
  const normalizedUrl = normalizeUrl(url);
  if (!/^https?:\/\//i.test(normalizedUrl)) return;
  const data = area();
  const link = {
    id: nextId('link', data.links),
    title: String(title || '').trim() || linkHost(normalizedUrl) || 'Ссылка',
    url: normalizedUrl,
    type: guessLinkType(normalizedUrl),
    description: '',
    pinned: data.links.length === 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: actorName(),
  };
  data.links.unshift(link);
  saveState();
  window.logWorkspaceActivity?.('workspace_link_changed', 'workspace_link', link.id, `Добавлена ссылка «${link.title}»`);
  renderWorkspace('links');
}

function guessLinkType(url) {
  const host = linkHost(url);
  if (host.includes('drive.google') || host.includes('docs.google')) return 'drive';
  if (host.includes('miro')) return 'miro';
  if (host.includes('figma')) return 'figma';
  if (host.includes('notion')) return 'notion';
  if (host.includes('sheets.google')) return 'sheet';
  return 'other';
}

export async function workspaceEditLink(id) {
  const data = area();
  const link = data.links.find(item => item.id === id);
  if (!link) return;
  const title = await window.showPrompt?.('Название ссылки', link.title || '');
  if (title == null) return;
  const url = await window.showPrompt?.('URL ссылки', link.url || 'https://');
  if (url == null) return;
  const normalizedUrl = normalizeUrl(url);
  link.title = String(title || '').trim() || linkHost(normalizedUrl) || 'Ссылка';
  link.url = normalizedUrl;
  link.type = guessLinkType(normalizedUrl);
  link.updatedAt = nowIso();
  saveState();
  window.logWorkspaceActivity?.('workspace_link_changed', 'workspace_link', id, `Изменена ссылка «${link.title}»`);
  renderWorkspace('links');
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
