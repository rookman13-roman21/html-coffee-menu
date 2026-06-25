  // ── INJECT HTML ────────────────────────────────────────────────
  var root = document.getElementById('adm-root');
  if (!root) { console.error('admin-panel.js: нет элемента #adm-root'); return; }
  root.innerHTML = `
    <div id="adm-login">
      <h2>🛡️ Администратор</h2>
      <p>Управление пользователями Barista School</p>
      <div class="adm-field"><label>Email</label><input type="email" id="adm-email" placeholder="admin@example.com" autocomplete="username" autocapitalize="none" autocorrect="off"></div>
      <div class="adm-field"><label>Пароль</label><input type="password" id="adm-pass" placeholder="••••••••" autocomplete="current-password"></div>
      <div id="adm-forgot-row"><button id="adm-forgot-link" type="button">Забыли пароль?</button></div>
      <button id="adm-login-btn">Войти</button>
      <div id="adm-login-err"></div>
      <div id="adm-forgot-form">
        <p>Введите ваш email — пришлём ссылку для сброса пароля.</p>
        <div class="adm-field"><label>Email</label><input type="email" id="adm-forgot-email" placeholder="admin@example.com" autocapitalize="none" autocorrect="off"></div>
        <button id="adm-forgot-btn">Отправить</button>
        <div id="adm-forgot-result"></div>
      </div>
    </div>

    <div id="adm-panel">
      <div class="adm-topbar">
        <div class="adm-topbar-brand">
          <img id="adm-logo-img" src="https://static.tildacdn.com/tild3534-3332-4438-b937-343762336637/_1.svg" alt="Moscow Barista School">
        </div>
        <div class="adm-topbar-right">
          <span id="adm-me"></span>
          <button id="adm-theme-btn" title="Сменить тему">🌙</button>
          <button id="adm-logout">Выйти</button>
        </div>
      </div>
      <div class="adm-tabs">
        <button class="adm-tab active" data-tab="users">👥 Пользователи</button>
        <button class="adm-tab" data-tab="eq">📚 Библиотека</button>
        <button class="adm-tab" data-tab="presets">🗂 Пресеты</button>
        <button class="adm-tab" data-tab="suppliers">🏭 Поставщики</button>
        <button class="adm-tab" data-tab="authors">🍸 Авторы</button>
      </div>
      <div id="adm-users-section">
      <div class="adm-stats">
        <div class="adm-stat"><div class="adm-stat-val" id="adm-s-total">—</div><div class="adm-stat-lbl">Всего</div></div>
        <div class="adm-stat s-active"><div class="adm-stat-val" id="adm-s-active">—</div><div class="adm-stat-lbl">Активных</div></div>
        <div class="adm-stat s-wait"><div class="adm-stat-val" id="adm-s-wait">—</div><div class="adm-stat-lbl">Ожидают</div></div>
        <div class="adm-stat s-admin"><div class="adm-stat-val" id="adm-s-admin">—</div><div class="adm-stat-lbl">Админов</div></div>
        <div class="adm-stat s-online"><div class="adm-stat-val" id="adm-s-online">—</div><div class="adm-stat-lbl">Онлайн 24ч</div></div>
      </div>
      <div class="adm-toolbar">
        <input class="adm-search" id="adm-search" placeholder="🔍 Поиск по email или имени...">
        <div class="adm-filter-btns">
          <button class="adm-fb active" data-f="all">Все</button>
          <button class="adm-fb" data-f="active">Активные</button>
          <button class="adm-fb" data-f="wait">Ожидают</button>
          <button class="adm-fb" data-f="admin">👑 Админы</button>
          <button class="adm-fb" data-f="online">🟢 Онлайн</button>
        </div>
        <button id="adm-csv-btn">⬇ CSV</button>
        <button id="adm-refresh">↻ Обновить</button>
      </div>
      <div class="adm-table-wrap">
        <div id="adm-loading">Загрузка...</div>
        <table class="adm-table" id="adm-table" style="display:none">
          <thead><tr>
            <th style="width:40px">#</th>
            <th data-sort="email">Email</th>
            <th data-sort="is_active" style="width:130px">Статус</th>
            <th style="width:170px">Доступ</th>
            <th style="width:80px">Действия</th>
          </tr></thead>
          <tbody id="adm-tbody"></tbody>
        </table>
      </div>
      <div id="adm-pagination"></div>
      </div>
      <div id="adm-eq-section" style="display:none">
        <div class="adm-eq-toolbar">
          <input class="adm-search" id="adm-eq-search" placeholder="🔍 Поиск по названию...">
          <button id="adm-eq-add-btn">+ Добавить</button>
          <button id="adm-eq-bulk-del" style="display:none">🗑 Удалить выбранные (<span id="adm-eq-sel-count">0</span>)</button>
        </div>
        <div id="adm-eq-coverage" class="adm-eq-coverage"></div>
        <div class="adm-lib-tabs-wrap">
          <div id="adm-eq-main-tabs" class="adm-lib-main-tabs"></div>
          <div id="adm-eq-context" class="adm-eq-context" style="display:none"></div>
          <div id="adm-eq-sub-tabs" class="adm-lib-sub-tabs" style="display:none"></div>
        </div>
        <div class="adm-table-wrap">
          <div id="adm-eq-loading">Загрузка...</div>
          <table class="adm-table" id="adm-eq-table" style="display:none">
            <thead><tr>
              <th style="width:36px"><input type="checkbox" id="adm-eq-check-all" class="adm-eq-check"></th>
              <th style="width:60px">Фото</th>
              <th>Название</th>
              <th style="width:100px">Цена</th>
              <th style="width:50px">Ссылка</th>
              <th style="width:90px"></th>
            </tr></thead>
            <tbody id="adm-eq-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="adm-suppliers-section" style="display:none">
        <div class="adm-eq-toolbar">
          <input class="adm-search" id="adm-sup-search" placeholder="🔍 Поиск по названию или тегу...">
          <button id="adm-sup-add-btn">+ Добавить</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          <button class="adm-sup-filter active" data-supf="all">Все</button>
          <button class="adm-sup-filter" data-supf="featured">⭐ Партнёры</button>
          <button class="adm-sup-filter" data-supf="public">✅ Публичные</button>
          <button class="adm-sup-filter" data-supf="hidden">🚫 Скрытые</button>
        </div>
        <div class="adm-table-wrap">
          <div id="adm-sup-loading">Загрузка...</div>
          <table class="adm-table" id="adm-sup-table" style="display:none">
            <thead><tr>
              <th style="width:56px">Лого</th>
              <th>Название</th>
              <th style="width:80px">Статус</th>
              <th style="width:80px">SPA</th>
              <th style="width:90px"></th>
            </tr></thead>
            <tbody id="adm-sup-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="adm-presets-section" style="display:none">
        <div class="adm-preset-fmttabs">
          <button class="adm-preset-fmt active" data-pfmt="kiosk">☕ Киоск <span class="adm-preset-fmt-cnt" id="adm-fmt-cnt-kiosk"></span></button>
          <button class="adm-preset-fmt" data-pfmt="island">🏕 Остров <span class="adm-preset-fmt-cnt" id="adm-fmt-cnt-island"></span></button>
          <button class="adm-preset-fmt" data-pfmt="full">🏪 Полноформат <span class="adm-preset-fmt-cnt" id="adm-fmt-cnt-full"></span></button>
        </div>
        <div id="adm-preset-fmt-totals" style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap"></div>
        <div class="adm-preset-panel">
          <div class="adm-preset-col">
            <div class="adm-preset-col-head" style="flex-direction:column;align-items:stretch;gap:8px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="adm-preset-col-title">Текущий пресет</span>
                <button id="adm-preset-save-btn">💾 Сохранить</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <div style="display:flex;align-items:baseline;gap:8px;">
                  <span class="adm-preset-total" id="adm-preset-total"></span>
                  <span class="adm-preset-col-cnt" id="adm-preset-count">0 поз.</span>
                </div>
                <button class="adm-preset-clear-btn" id="adm-preset-clear-btn" title="Очистить весь пресет">🗑 Очистить</button>
              </div>
            </div>
            <div class="adm-preset-list" id="adm-preset-list">
              <div class="adm-preset-empty">Загрузка...</div>
            </div>
            <div class="adm-preset-copy-row" id="adm-preset-copy-row">
              <span class="adm-preset-copy-lbl">Скопировать из:</span>
              <button class="adm-preset-copy-btn" data-copy-from="kiosk">☕ Киоск</button>
              <button class="adm-preset-copy-btn" data-copy-from="island">🏕 Остров</button>
              <button class="adm-preset-copy-btn" data-copy-from="full">🏪 Полноформат</button>
            </div>
          </div>
          <div class="adm-preset-col">
            <div class="adm-preset-col-head">
              <span class="adm-preset-col-title">Добавить из библиотеки</span>
            </div>
            <input id="adm-preset-search" type="text" placeholder="🔍 Поиск по библиотеке...">
            <label class="adm-preset-hide-added">
              <input id="adm-preset-hide-added" type="checkbox">
              <span>Скрыть уже добавленные</span>
            </label>
            <div id="adm-preset-subcat-tabs"></div>
            <div class="adm-preset-lib-scroll" id="adm-preset-lib-list"></div>
          </div>
        </div>
      </div>
      <div id="adm-authors-section" style="display:none">
        <div class="adm-eq-toolbar">
          <div>
            <div style="font-weight:800;color:var(--adm-text);font-size:18px">Авторы рецептов</div>
            <div style="font-size:12px;color:var(--adm-muted);margin-top:2px">Профили, публикации и модерация витрины</div>
          </div>
          <button id="adm-authors-refresh">↻ Обновить</button>
        </div>
        <div class="adm-authors-grid">
          <div class="adm-authors-card">
            <div class="adm-authors-card-title">Авторы</div>
            <div id="adm-authors-list" class="adm-authors-list">Загрузка...</div>
          </div>
          <div class="adm-authors-card">
            <div class="adm-authors-card-title">Рецепты на публикации</div>
            <div class="adm-author-filters">
              <select id="adm-author-status-filter">
                <option value="">Все статусы</option>
                <option value="submitted">На проверке</option>
                <option value="rejected">На доработке</option>
                <option value="published">Опубликован</option>
                <option value="archived">Снят</option>
              </select>
              <input id="adm-author-search" type="search" placeholder="Поиск по рецептам">
            </div>
            <div id="adm-author-recipes-list" class="adm-author-recipes-list">Загрузка...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Confirm-модал и toast вставляем прямо в body, чтобы position:fixed работал корректно внутри Tilda
  var _overlay = document.createElement('div');
  _overlay.innerHTML = `
    <div id="adm-confirm">
      <div id="adm-confirm-box">
        <h3 id="adm-confirm-title">Подтвердите</h3>
        <p id="adm-confirm-text">Вы уверены?</p>
        <div class="adm-confirm-btns">
          <button id="adm-confirm-cancel">Отмена</button>
          <button id="adm-confirm-ok">Удалить</button>
        </div>
      </div>
    </div>
    <div id="adm-toast"></div>
    <div id="adm-drawer-backdrop"></div>
    <div id="adm-drawer">
      <div id="adm-drawer-head">
        <div id="adm-drawer-av">?</div>
        <div id="adm-drawer-head-text">
          <p id="adm-drawer-name">—</p>
          <p id="adm-drawer-email">—</p>
        </div>
        <button id="adm-drawer-close">✕</button>
      </div>
      <div id="adm-drawer-body"></div>
      <div id="adm-drawer-footer"></div>
    </div>
    <div id="adm-author-review-backdrop"></div>
    <div id="adm-author-review-drawer">
      <div id="adm-author-review-head">
        <div>
          <p id="adm-author-review-title">Проверка рецепта</p>
          <span id="adm-author-review-sub">—</span>
        </div>
        <button id="adm-author-review-close">✕</button>
      </div>
      <div id="adm-author-review-body"></div>
      <div id="adm-author-review-footer"></div>
    </div>
    <div id="adm-eq-drawer-backdrop"></div>
    <div id="adm-eq-drawer">
      <div id="adm-eq-drawer-head">
        <p id="adm-eq-drawer-title">Добавить оборудование</p>
        <button id="adm-eq-drawer-close">✕</button>
      </div>
      <div id="adm-eq-drawer-body">
        <div class="adm-eq-field">
          <label>URL товара (для автозаполнения)</label>
          <input type="text" id="adm-eq-url-input" placeholder="https://...">
          <div style="display:flex;gap:6px;margin-top:4px">
            <button id="adm-eq-ai-btn" style="flex:1">✨ Заполнить автоматически</button>
            <button id="adm-eq-apikey-btn" title="Настроить OpenAI API ключ" style="background:#f3f0ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;color:#6c3fc5;font-family:inherit;flex-shrink:0">🔑</button>
          </div>
          <div id="adm-eq-ai-status" style="font-size:11px;color:#6b7280;margin-top:3px"></div>
        </div>
        <div class="adm-eq-field">
          <label>Название *</label>
          <input type="text" id="adm-eq-name" placeholder="Кофемашина La Marzocco...">
        </div>
        <div class="adm-eq-field">
          <label>Раздел *</label>
          <select id="adm-eq-main-cat"></select>
        </div>
        <div class="adm-eq-field">
          <label style="display:flex;justify-content:space-between;align-items:center">Подкатегория *<button type="button" onclick="openSubcatManager(document.getElementById('adm-eq-main-cat').value)" style="font-size:11px;font-weight:600;color:#417033;background:none;border:none;cursor:pointer;padding:0;margin:0">⚙ Управление</button></label>
          <select id="adm-eq-cat-select"></select>
          <div class="adm-new-cat-row">
            <input type="text" id="adm-eq-new-cat" placeholder="Новая категория...">
            <button id="adm-eq-new-cat-btn">+ Создать</button>
          </div>
        </div>
        <div class="adm-eq-field">
          <label>Цена (₽)</label>
          <input type="number" id="adm-eq-price" placeholder="0" min="0" step="100">
        </div>
        <div class="adm-eq-field">
          <label>URL фотографии</label>
          <input type="text" id="adm-eq-photo" placeholder="https://...">
          <img id="adm-eq-photo-preview" alt="Превью">
        </div>
        <div class="adm-eq-field">
          <label>Порядок сортировки</label>
          <input type="number" id="adm-eq-sort-order" placeholder="0" min="0" step="10" value="0">
        </div>
        <div class="adm-eq-field">
          <label>Описание / особые условия</label>
          <textarea id="adm-eq-description" placeholder="Например: официальный партнёр, сервисное обслуживание включено, гарантия 2 года..." rows="3" style="resize:vertical;border:1.5px solid #cde3c5;border-radius:9px;padding:9px 12px;font-size:14px;font-family:inherit;width:100%;background:#fafaf9;color:#1a1a1a;outline:none"></textarea>
        </div>
        <div class="adm-eq-field" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="display:flex;flex-direction:column;gap:5px">
            <label style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">Промокод</label>
            <input type="text" id="adm-eq-promo-code" placeholder="BARISTA10" style="text-transform:uppercase;letter-spacing:.05em">
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <label style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">Действует до</label>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="date" id="adm-eq-promo-expires" style="flex:1;min-width:0">
              <button type="button" title="Убрать срок" onclick="var el=document.getElementById('adm-eq-promo-expires');el.value='';el.dispatchEvent(new Event('change'))" style="flex-shrink:0;width:30px;height:30px;border:1.5px solid #d1d5db;border-radius:7px;background:#f9fafb;color:#6b7280;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,border-color .15s" onmouseover="this.style.background='#fee2e2';this.style.borderColor='#fca5a5';this.style.color='#ef4444'" onmouseout="this.style.background='#f9fafb';this.style.borderColor='#d1d5db';this.style.color='#6b7280'">×</button>
            </div>
          </div>
        </div>
        <label class="adm-eq-toggle-row" for="adm-eq-is-public">
          <div class="adm-eq-toggle-info">
            <span class="adm-eq-toggle-title">👁 Показывать в SPA</span>
            <span class="adm-eq-toggle-desc">Позиция видна пользователям в приложении</span>
          </div>
          <div class="adm-eq-toggle-switch">
            <input type="checkbox" id="adm-eq-is-public" checked>
            <span class="adm-eq-toggle-slider"></span>
          </div>
        </label>
        <label class="adm-eq-toggle-row" for="adm-eq-is-featured">
          <div class="adm-eq-toggle-info">
            <span class="adm-eq-toggle-title">⭐ Рекомендуем</span>
            <span class="adm-eq-toggle-desc">Выделяет позицию значком в каталоге</span>
          </div>
          <div class="adm-eq-toggle-switch">
            <input type="checkbox" id="adm-eq-is-featured">
            <span class="adm-eq-toggle-slider"></span>
          </div>
        </label>
      </div>
      <div id="adm-eq-drawer-footer">
        <button class="adm-eq-footer-btn cancel" id="adm-eq-cancel-btn">Отмена</button>
        <button class="adm-eq-footer-btn save" id="adm-eq-save-btn">Сохранить</button>
      </div>
    </div>
    <div id="adm-sup-drawer-backdrop"></div>
    <div id="adm-sup-drawer">
      <div id="adm-eq-drawer-head">
        <p id="adm-sup-drawer-title">Новый поставщик</p>
        <button id="adm-sup-drawer-close">✕</button>
      </div>
      <div id="adm-eq-drawer-body">
        <div class="adm-eq-field">
          <label>Название *</label>
          <input type="text" id="adm-sup-name" placeholder="Rockets.coffee">
        </div>
        <div class="adm-eq-field">
          <label>Телефон</label>
          <input type="text" id="adm-sup-phone" placeholder="+7 (999) 123-45-67">
        </div>
        <div class="adm-eq-field">
          <label>Сайт</label>
          <input type="text" id="adm-sup-site" placeholder="https://rockets.coffee">
        </div>
        <div class="adm-eq-field">
          <label>Заметка</label>
          <textarea id="adm-sup-note" placeholder="Описание поставщика..." rows="3" style="width:100%;border:1.5px solid var(--adm-border);border-radius:10px;padding:10px 12px;font-size:14px;outline:none;background:var(--adm-input);color:var(--adm-text);resize:vertical;font-family:inherit"></textarea>
        </div>
        <div class="adm-eq-field">
          <label>URL логотипа</label>
          <input type="text" id="adm-sup-logo_url" placeholder="https://...">
          <img id="adm-sup-logo-preview" alt="preview">
        </div>
        <div class="adm-sup-section-label">🏷 Промоакция</div>
        <div class="adm-eq-field">
          <label>Промокод</label>
          <input type="text" id="adm-sup-promo_code" placeholder="BARISTA10" style="text-transform:uppercase;letter-spacing:.05em">
        </div>
        <div class="adm-eq-field">
          <label>Срок действия</label>
          <input type="date" id="adm-sup-promo_expires">
        </div>
        <div class="adm-eq-field">
          <label>Описание скидки</label>
          <input type="text" id="adm-sup-promo_desc" placeholder="Скидка 10% на первый заказ">
        </div>
        <div class="adm-eq-field">
          <label>Теги (через запятую)</label>
          <input type="text" id="adm-sup-tags" placeholder="кофе, обжарка, оптовик">
        </div>
        <div class="adm-eq-field">
          <label>Порядок сортировки</label>
          <input type="number" id="adm-sup-sort_order" value="0" min="0">
        </div>
        <label class="adm-eq-toggle-row" for="adm-sup-is_public">
          <div class="adm-eq-toggle-info">
            <span class="adm-eq-toggle-title">👁 Показывать в SPA</span>
            <span class="adm-eq-toggle-desc">Поставщик виден пользователям в приложении</span>
          </div>
          <div class="adm-eq-toggle-switch">
            <input type="checkbox" id="adm-sup-is_public" checked>
            <span class="adm-eq-toggle-slider"></span>
          </div>
        </label>
        <label class="adm-eq-toggle-row" for="adm-sup-is_featured">
          <div class="adm-eq-toggle-info">
            <span class="adm-eq-toggle-title">⭐ Партнёр MBS</span>
            <span class="adm-eq-toggle-desc">Выделяет поставщика значком партнёра</span>
          </div>
          <div class="adm-eq-toggle-switch">
            <input type="checkbox" id="adm-sup-is_featured">
            <span class="adm-eq-toggle-slider"></span>
          </div>
        </label>
      </div>
      <div id="adm-eq-drawer-footer">
        <button class="adm-eq-footer-btn cancel" id="adm-sup-cancel-btn">Отмена</button>
        <button class="adm-eq-footer-btn save" id="adm-sup-save-btn">Сохранить</button>
      </div>
    </div>
  `;
  document.body.appendChild(_overlay);
