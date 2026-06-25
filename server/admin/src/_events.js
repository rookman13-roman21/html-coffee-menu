  // ── EVENTS (делегирование) ─────────────────────────────────────
  // adm-drawer и adm-confirm находятся в _overlay (document.body), вне #adm-root,
  // поэтому обработчик нужен и на _overlay, и на root.
  // Один общий обработчик вешается на document — он ловит клики из обоих контейнеров.
  document.getElementById('adm-confirm').addEventListener('click', function(e){ if (e.target === this) this.classList.remove('show'); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') { document.getElementById('adm-confirm').classList.remove('show'); } });

  function _handleClick(e) {
    var el = e.target;

    // Клик по строке таблицы → открыть drawer
    var tr = el.closest('tr[data-uid]');
    if (tr && !el.closest('[data-act]') && !el.closest('.adm-row-actions')) {
      var uid = parseInt(tr.dataset.uid);
      var user = _users.find(function(x){ return x.id === uid; });
      if (user) openDrawer(user);
      return;
    }

    // Кнопка входа
    if (el.id === 'adm-login-btn') { doLogin(); return; }

    if (el.id === 'adm-forgot-link') {
      var ff = document.getElementById('adm-forgot-form');
      ff.style.display = ff.style.display === 'none' || !ff.style.display ? 'block' : 'none';
      if (ff.style.display === 'block') {
        var fe = document.getElementById('adm-forgot-email');
        fe.value = document.getElementById('adm-email').value || '';
        fe.focus();
      }
      return;
    }

    if (el.id === 'adm-forgot-btn') {
      var fEmail = document.getElementById('adm-forgot-email').value.trim().toLowerCase();
      var fRes   = document.getElementById('adm-forgot-result');
      var fBtn   = document.getElementById('adm-forgot-btn');
      fRes.textContent = '';
      if (!fEmail) { fRes.style.color = 'var(--adm-red)'; fRes.textContent = 'Введите email'; return; }
      fBtn.disabled = true; fBtn.textContent = 'Отправляем…';
      fetch(API + '/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fEmail, source: 'admin' })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.ok) {
          fRes.style.color = 'var(--adm-red)';
          fRes.textContent = d.detail || 'Ошибка';
          return;
        }
        if (d.email_sent) {
          fRes.style.color = '#2d8a56';
          fRes.textContent = '✓ Если email найден, ссылка для сброса отправлена на почту.';
        } else {
          fRes.style.color = 'var(--adm-red)';
          fRes.textContent = 'Email не доставлен. Проверьте SMTP и повторите сброс.';
        }
      })
      .catch(function() { fRes.style.color = 'var(--adm-red)'; fRes.textContent = 'Ошибка сети'; })
      .finally(function() { fBtn.disabled = false; fBtn.textContent = 'Отправить'; });
      return;
    }

    // Выход
    if (el.id === 'adm-logout') { doLogout(); return; }

    // Смена темы
    if (el.id === 'adm-theme-btn') {
      var isDark = document.body.classList.toggle('dark');
      el.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('adm_theme', isDark ? 'dark' : 'light');
      var logoImg = document.getElementById('adm-logo-img');
      if (logoImg) logoImg.src = isDark
        ? 'https://static.tildacdn.com/tild6131-3765-4030-a666-656363633265/_1_1.svg'
        : 'https://static.tildacdn.com/tild3534-3332-4438-b937-343762336637/_1.svg';
      return;
    }

    // Обновить
    if (el.id === 'adm-refresh') { load(); return; }
    if (el.id === 'adm-authors-refresh') { loadAuthors(); return; }

    // CSV
    if (el.id === 'adm-csv-btn') { exportCsv(); return; }

    // Пагинация
    if (el.id === 'adm-pag-prev') { _page--; render(); return; }
    if (el.id === 'adm-pag-next') { _page++; render(); return; }
    if (el.classList.contains('adm-pag-btn') && el.dataset.pg) { _page = parseInt(el.dataset.pg); render(); return; }

    // Сортировка по колонке
    if (el.tagName === 'TH' && el.dataset.sort) {
      var col = el.dataset.sort;
      if (_sort.col === col) { _sort.dir *= -1; } else { _sort.col = col; _sort.dir = -1; }
      _page = 1;
      render();
      return;
    }

    // Фильтры
    if (el.classList.contains('adm-fb')) {
      _filter = el.dataset.f;
      _page = 1;
      root.querySelectorAll('.adm-fb').forEach(function(b){ b.classList.remove('active'); });
      el.classList.add('active');
      render(); return;
    }

    // Отмена confirm
    if (el.id === 'adm-confirm-cancel') {
      document.getElementById('adm-confirm').classList.remove('show'); return;
    }
    if (el.id === 'adm-author-review-close' || el.id === 'adm-author-review-backdrop') {
      closeAuthorReview();
      return;
    }

    // Действия в таблице
    var act = el.dataset.act;
    if (!act) return;
    var id = parseInt(el.dataset.id);

    if (act === 'author-review-open') {
      openAuthorReview(id);
      return;
    }

    if (act === 'author-review-save') {
      updateAuthorRecipeFromReview(el.dataset.status || '');
      return;
    }

    if (act === 'author-sync-bitrix') {
      syncAuthorBitrix(id);
      return;
    }

    if (act === 'details') {
      var uD = _users.find(function(x){ return x.id === id; });
      if (uD) openDrawer(uD);
      return;
    }

    if (act === 'activate' || act === 'deactivate') {
      var activate = act === 'activate';
      var actionLabel = activate ? 'Активировать' : 'Заблокировать';
      var u0 = _users.find(function(x){ return x.id === id; });
      document.getElementById('adm-confirm-title').textContent = actionLabel + ' пользователя?';
      document.getElementById('adm-confirm-text').textContent  = (u0 ? u0.email : '') + ' — вы уверены?';
      var okBtn = document.getElementById('adm-confirm-ok');
      okBtn.textContent = actionLabel;
      okBtn.style.background = activate ? '#417033' : '#c44';
      okBtn.onclick = function() {
        document.getElementById('adm-confirm').classList.remove('show');
        api('POST', '/admin/' + act + '/' + id)
          .then(function() {
            var u = _users.find(function(x){ return x.id === id; });
            if (u) { u.is_active = activate; openDrawer(u); }
            render(); updateStats();
            toast(activate ? '✅ Пользователь активирован' : '🚫 Пользователь заблокирован');
          })
          .catch(function(e){ toast('❌ ' + e.message); });
      };
      document.getElementById('adm-confirm').classList.add('show');
      return;
    }

    if (act === 'makeadmin') {
      var u1 = _users.find(function(x){ return x.id === id; });
      document.getElementById('adm-confirm-title').textContent = 'Назначить администратором?';
      document.getElementById('adm-confirm-text').textContent  = (u1 ? u1.email : '') + ' получит полный доступ к админ-панели.';
      var okBtn2 = document.getElementById('adm-confirm-ok');
      okBtn2.textContent = 'Назначить';
      okBtn2.style.background = '#6c3fc5';
      okBtn2.onclick = function() {
        document.getElementById('adm-confirm').classList.remove('show');
        api('PATCH', '/admin/users/' + id, { is_admin: true })
          .then(function() {
            var u = _users.find(function(x){ return x.id === id; });
            if (u) u.is_admin = true;
            render(); updateStats();
            toast('👑 Назначен администратором');
          })
          .catch(function(e){ toast('❌ ' + e.message); });
      };
      document.getElementById('adm-confirm').classList.add('show');
      return;
    }

    if (act === 'resetpw') {
      var emailReset = el.dataset.email;
      document.getElementById('adm-confirm-title').textContent = 'Сбросить пароль?';
      document.getElementById('adm-confirm-text').textContent  = 'Ссылка для сброса пароля будет отправлена на почту: ' + emailReset;
      var okBtnReset = document.getElementById('adm-confirm-ok');
      okBtnReset.textContent = 'Отправить';
      okBtnReset.style.background = '#b45309';
      okBtnReset.onclick = function() {
        document.getElementById('adm-confirm').classList.remove('show');
        api('POST', '/auth/forgot-password', { email: emailReset, source: 'user' })
          .then(function(d) {
            if (!d.ok) { toast('\u274c ' + (d.detail || 'Ошибка')); return; }
            if (d.email_sent) {
              toast('📧 Ссылка для сброса отправлена на ' + emailReset, 5000);
            } else {
              toast('⚠️ Email не доставлен. Проверьте SMTP и повторите сброс.', 12000);
            }
          })
          .catch(function(e){ toast('\u274c ' + e.message); });
      };
      document.getElementById('adm-confirm').classList.add('show');
      return;
    }

    if (act === 'delete') {
      var email = el.dataset.email;
      document.getElementById('adm-confirm-title').textContent = 'Удалить пользователя?';
      document.getElementById('adm-confirm-text').textContent  = 'Удалить «' + email + '»? Действие необратимо.';
      var okBtn3 = document.getElementById('adm-confirm-ok');
      okBtn3.textContent = 'Удалить';
      okBtn3.style.background = '#c44';
      okBtn3.onclick = function() {
        document.getElementById('adm-confirm').classList.remove('show');
        api('DELETE', '/admin/users/' + id)
          .then(function() {
            _users = _users.filter(function(u){ return u.id !== id; });
            render(); updateStats();
            toast('🗑️ Пользователь удалён');
          })
          .catch(function(e){ toast('❌ ' + e.message); });
      };
      document.getElementById('adm-confirm').classList.add('show');
      return;
    }

    // Equipment actions
    if (act === 'eq-edit') {
      var eqIt = _oc_items.find(function(x){ return x.id === parseInt(el.dataset.id); });
      if (eqIt) openEqDrawer(eqIt);
      return;
    }
    if (act === 'eq-del') {
      deleteEqItem(parseInt(el.dataset.id));
      return;
    }
    if (act === 'eq-toggle-pub') {
      var itPub = _oc_items.find(function(x) { return x.id === parseInt(el.dataset.id); });
      if (itPub) {
        var newPub = itPub.is_public ? 0 : 1;
        api('PUT', '/admin/oc-library/' + itPub.id, Object.assign({}, itPub, { is_public: newPub })).then(function() {
          itPub.is_public = newPub;
          renderOcLibrary();
        });
      }
      return;
    }
  }
  root.addEventListener('click', _handleClick);
  _overlay.addEventListener('click', _handleClick);

  // Equipment tab events (вкладки, поиск, чекбоксы)
  root.addEventListener('click', function(e) {
    var el = e.target;
    // Switch tab
    if (el.classList.contains('adm-tab') && el.dataset.tab) {
      switchAdmTab(el.dataset.tab);
      return;
    }
    if (el.id === 'adm-eq-add-btn' || el.closest('[data-eq-empty-add]')) { openEqDrawer(null); return; }
    if (el.id === 'adm-eq-bulk-del') { bulkDeleteEq(); return; }
    if (el.id === 'adm-eq-check-all') {
      var allIds = _oc_items.map(function(x){ return x.id; });
      _oc_selected = el.checked ? allIds : [];
      renderOcLibrary();
      return;
    }
    if (el.classList.contains('adm-eq-check-row')) {
      var rowId = parseInt(el.dataset.id);
      var idx = _oc_selected.indexOf(rowId);
      if (el.checked && idx < 0) _oc_selected.push(rowId);
      else if (!el.checked && idx >= 0) _oc_selected.splice(idx, 1);
      updateBulkDelBtn();
      return;
    }
    // Клик по строке — открыть редактирование (если не кнопка и не чекбокс)
    var row = el.closest('tr[data-eq-id]');
    if (row && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT' && el.tagName !== 'A') {
      var eqId = parseInt(row.dataset.eqId);
      var eqItem = _oc_items.find(function(x) { return x.id === eqId; });
      if (eqItem) openEqDrawer(eqItem);
      return;
    }
  });

  root.addEventListener('input', function(e) {
    if (e.target.id === 'adm-eq-search') renderOcLibrary();
    if (e.target.id === 'adm-sup-search') renderSuppliers();
    if (e.target.id === 'adm-sup-logo_url') {
      var prev = document.getElementById('adm-sup-logo-preview');
      if (prev) {
        var url = e.target.value.trim();
        if (url) { prev.src = url; prev.style.display = 'block'; prev.onerror = function(){ prev.style.display='none'; }; }
        else prev.style.display = 'none';
      }
    }
    if (e.target.dataset.presetIdx !== undefined) {
      var idx = parseInt(e.target.dataset.presetIdx);
      if (_preset_items[idx]) {
        _preset_items[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
        _presetMarkDirty();
        // Обновить только итог и цену строки без полного ре-рендера
        var total = _preset_items.reduce(function(s, it) { return s + (it.price || 0) * (it.qty || 1); }, 0);
        var totalEl = document.getElementById('adm-preset-total');
        if (totalEl) totalEl.textContent = total ? '≈ ' + total.toLocaleString('ru-RU') + ' ₽' : '';
      }
    }
    if (e.target.id === 'adm-preset-search') renderPresetLibrary();
  });

  // ── PRESETS EVENTS ─────────────────────────────────────────────
  root.addEventListener('click', function(e) {
    var el = e.target;
    // Переключение формата пресета
    var fmtBtn = el.closest('.adm-preset-fmt');
    if (fmtBtn && fmtBtn.dataset.pfmt) { loadPresets(fmtBtn.dataset.pfmt); return; }
    // Сохранить пресет
    if (el.id === 'adm-preset-save-btn') { savePreset(); return; }
    // Удалить из пресета
    if (el.dataset.presetRemove !== undefined) {
      _preset_items.splice(parseInt(el.dataset.presetRemove), 1);
      _presetMarkDirty();
      renderPresets();
      renderPresetLibrary();
      return;
    }
    // Очистить пресет
    if (el.id === 'adm-preset-clear-btn') { clearPreset(); return; }
    // Скопировать из другого формата
    var copyBtn = el.closest('[data-copy-from]');
    if (copyBtn && copyBtn.dataset.copyFrom) { copyPreset(copyBtn.dataset.copyFrom); return; }
    // Добавить в пресет из библиотеки
    if (el.dataset.plibId && !el.disabled) {
      var libId = parseInt(el.dataset.plibId);
      var it = _oc_items.find(function(x) { return x.id === libId; });
      if (it && !_preset_items.some(function(p) { return p.lib_item_id === libId; })) {
        _preset_items.push({
          lib_item_id: libId,
          qty: 1,
          name: it.name,
          price: it.price,
          photo: it.photo || '',
          category: it.category || 'equipment',
          subcategory: it.subcategory || ''
        });
        _presetMarkDirty();
        renderPresets();
        renderPresetLibrary();
      }
      return;
    }
    // Фильтр по категории в библиотеке пресетов
    var catBtn = el.closest('[data-pcat]');
    if (catBtn && catBtn.classList.contains('adm-lib-tab')) {
      _preset_lib_cat = catBtn.dataset.pcat;
      renderPresetLibrary();
      return;
    }
  });
  root.addEventListener('change', function(e) {
    if (e.target.id === 'adm-preset-hide-added') {
      _preset_hide_added = !!e.target.checked;
      renderPresetLibrary();
    }
  });
  root.addEventListener('click', function(e) {
    var btn = e.target.closest('.adm-lib-tab');
    if (!btn) return;
    if (btn.hasAttribute('data-tab-main')) {
      _oc_main_tab = btn.getAttribute('data-tab-main');
      _oc_sub_tab = '';
      updateEqCatFilter();
      renderOcLibrary();
    } else if (btn.hasAttribute('data-tab-sub')) {
      _oc_sub_tab = btn.getAttribute('data-tab-sub');
      updateEqCatFilter();
      renderOcLibrary();
    }
  });

  // Equipment drawer events
  document.addEventListener('click', function(e) {
    var el = e.target;
    if (el.id === 'adm-drawer-close' || el.id === 'adm-drawer-backdrop') closeDrawer();
    if (el.id === 'adm-eq-drawer-close' || el.id === 'adm-eq-drawer-backdrop') closeEqDrawer();
    if (el.id === 'adm-eq-cancel-btn') { closeEqDrawer(); return; }
    if (el.id === 'adm-eq-save-btn') { saveEqItem(); return; }
    // Suppliers drawer
    if (el.id === 'adm-sup-drawer-close' || el.id === 'adm-sup-drawer-backdrop') closeSupDrawer();
    if (el.id === 'adm-sup-cancel-btn') { closeSupDrawer(); return; }
    if (el.id === 'adm-sup-save-btn') { saveSupItem(); return; }
    if (el.id === 'adm-sup-add-btn') { openSupDrawer(null); return; }
    var supFilt = el.closest('.adm-sup-filter');
    if (supFilt && supFilt.dataset.supf) {
      _sup_filter = supFilt.dataset.supf;
      document.querySelectorAll('.adm-sup-filter').forEach(function(b){ b.classList.toggle('active', b.dataset.supf === _sup_filter); });
      renderSuppliers();
      return;
    }
    var supEditBtn = el.closest('[data-sup-edit]');
    if (supEditBtn) { openSupDrawer(parseInt(supEditBtn.dataset.supEdit)); return; }
    var supDelBtn = el.closest('[data-sup-del]');
    if (supDelBtn) { deleteSupItem(parseInt(supDelBtn.dataset.supDel)); return; }
    if (el.id === 'adm-eq-apikey-btn') {
      var cur = localStorage.getItem('adm_openai_key') || '';
      var k = prompt('OpenAI API ключ (sk-...):\n\nКлюч хранится только в вашем браузере.', cur);
      if (k === null) return;
      var statusEl = document.getElementById('adm-eq-ai-status');
      if (k.trim()) {
        localStorage.setItem('adm_openai_key', k.trim());
        if (statusEl) statusEl.textContent = '✅ GPT-ключ настроен — AI определит категорию автоматически';
      } else {
        localStorage.removeItem('adm_openai_key');
        if (statusEl) statusEl.textContent = '';
      }
      return;
    }
    if (el.id === 'adm-eq-ai-btn') {
      var urlInput = document.getElementById('adm-eq-url-input');
      var url = urlInput ? urlInput.value.trim() : '';
      if (!url) { alert('Введите URL товара'); return; }
      var apiKey = localStorage.getItem('adm_openai_key');
      var aiBtn = el;
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<span class="adm-ai-spinner"></span> Загружаю страницу…';
      // ─── Шаг 1: proxy-meta ───────────────────────────────────────────
      fetch('https://barista-school.online/api/proxy-meta?url=' + encodeURIComponent(url), { signal: AbortSignal.timeout(10000) })
        .then(function(r) { return r.ok ? r.json() : {}; })
        .catch(function() { return {}; })
        .then(function(meta) {
          var ogImage = (meta && meta.ok) ? (meta.og_image || '') : '';
          var prices  = (meta && meta.ok && meta.prices) ? meta.prices : [];
          var ogTitle = (meta && meta.ok) ? (meta.og_title || '') : '';
          var descr   = (meta && meta.ok) ? (meta.description || '') : '';

          // ─── Шаг 2а: если есть GPT-ключ — анализируем через OpenAI ──
          if (apiKey) {
            aiBtn.innerHTML = '<span class="adm-ai-spinner"></span> Анализирую…';
            var catSel2 = document.getElementById('adm-eq-cat-select');
            var cats2 = [];
            if (catSel2) { for (var i=0;i<catSel2.options.length;i++) { if (catSel2.options[i].value) cats2.push(catSel2.options[i].value); } }
            var defaultCats = 'Кофемашина, Кофемолка, Аксессуары бариста, Блендер, Холодильник, Витрина, Ледогенератор, Соковыжималка, Посудомоечная машина, Водонагреватель/бойлер, Водоподготовка, Термосы и диспенсеры, Кассовое оборудование, Вытяжка/вентиляция, Другое';
            var catList = cats2.length ? cats2.join(', ') + ', Другое' : defaultCats;
            var pageCtx = [
              ogTitle   && ('Заголовок: ' + ogTitle),
              descr     && ('Описание: ' + descr),
              ogImage   && ('og:image: ' + ogImage),
              prices.length ? 'Цена товара (руб): ' + prices[0] + ' — используй её' : 'Цена не найдена — верни price: 0',
            ].filter(Boolean).join('\n');
            var gptPrompt = 'Ты помощник для планирования бюджета кофейни.\nПользователь добавляет позицию оборудования. Вот данные:\n- URL товара: ' + url + '\n\nДанные со страницы:\n' + pageCtx + '\n\nДоступные категории: ' + catList + '\n\nВерни ТОЛЬКО JSON (без markdown):\n{"name": "краткое читаемое название (до 60 символов)", "category": "одна из доступных категорий или Другое", "price": числовая_цена_или_0, "photo": "' + (ogImage || '') + '"}';
            fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
              body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: gptPrompt }], max_tokens: 200, temperature: 0.1 }),
            }).then(function(r) { return r.json(); }).then(function(data) {
              var text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
              var m = text.match(/\{[\s\S]*?\}/);
              if (!m) throw new Error('AI не вернул JSON');
              var p = JSON.parse(m[0]);
              var nameEl2 = document.getElementById('adm-eq-name');
              var photoEl2 = document.getElementById('adm-eq-photo');
              var priceEl2 = document.getElementById('adm-eq-price');
              var catSel3  = document.getElementById('adm-eq-cat-select');
              if (nameEl2 && p.name) nameEl2.value = p.name;
              if (priceEl2 && p.price > 0) priceEl2.value = p.price;
              if (p.photo || ogImage) {
                var photoSrc2 = ogImage || p.photo;
                if (photoEl2) photoEl2.value = photoSrc2;
                var prev2 = document.getElementById('adm-eq-photo-preview');
                if (prev2 && photoSrc2) { prev2.src = photoSrc2; prev2.style.display = 'block'; }
              }
              // Выбрать или создать категорию
              if (p.category && catSel3) {
                var found = false;
                for (var j=0;j<catSel3.options.length;j++) {
                  if (catSel3.options[j].value.toLowerCase() === p.category.toLowerCase()) {
                    catSel3.value = catSel3.options[j].value; found = true; break;
                  }
                }
                if (!found && p.category !== 'Другое') {
                  var newOpt = document.createElement('option');
                  newOpt.value = p.category; newOpt.textContent = p.category;
                  catSel3.appendChild(newOpt);
                  catSel3.value = p.category;
                }
              }
            }).catch(function(e) {
              // Fallback без GPT
              _admAiFillBasic(ogTitle, ogImage, prices);
              alert('GPT-анализ не удался (' + e.message + '). Заполнены базовые поля — укажите категорию вручную.');
            }).finally(function() {
              aiBtn.disabled = false; aiBtn.innerHTML = '✨ Заполнить автоматически';
            });
          } else {
            // ─── Шаг 2б: без GPT-ключа — только meta-данные ─────────────
            if (ogTitle || ogImage || prices.length) {
              _admAiFillBasic(ogTitle, ogImage, prices);
              var statusEl2 = document.getElementById('adm-eq-ai-status');
              if (statusEl2) statusEl2.innerHTML = '⚠️ Название и фото заполнены из мета-тегов. <button id="adm-eq-set-gpt" style="background:none;border:none;color:#6c3fc5;cursor:pointer;font-size:11px;text-decoration:underline;font-family:inherit;padding:0">Добавить GPT-ключ</button> для автоопределения категории.';
              var setGptBtn = document.getElementById('adm-eq-set-gpt');
              if (setGptBtn) setGptBtn.onclick = function() {
                var k2 = prompt('OpenAI API ключ (sk-...):', '');
                if (k2 && k2.trim()) {
                  localStorage.setItem('adm_openai_key', k2.trim());
                  var s = document.getElementById('adm-eq-ai-status');
                  if (s) s.textContent = '✅ GPT-ключ сохранён. Нажмите «Заполнить» ещё раз.';
                }
              };
            } else {
              alert('Не удалось получить данные со страницы. Заполните поля вручную.');
            }
            aiBtn.disabled = false; aiBtn.innerHTML = '✨ Заполнить автоматически';
          }
        });
      return;
    }
    if (el.id === 'adm-eq-new-cat-btn') {
      var newCat = document.getElementById('adm-eq-new-cat');
      var catSel = document.getElementById('adm-eq-cat-select');
      if (newCat && newCat.value.trim() && catSel) {
        var v = newCat.value.trim();
        var opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        catSel.appendChild(opt);
        catSel.value = v;
        newCat.value = '';
      }
      return;
    }
  });

  document.addEventListener('input', function(e) {
    if (e.target.id === 'adm-eq-photo') {
      var prev = document.getElementById('adm-eq-photo-preview');
      if (prev) {
        var v = e.target.value.trim();
        prev.src = v;
        prev.style.display = v ? 'block' : 'none';
      }
    }
  });

  // Enter в полях логина
  root.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      if (e.target.id === 'adm-email') document.getElementById('adm-pass').focus();
      if (e.target.id === 'adm-pass')  doLogin();
    }
  });

  // Поиск
  root.addEventListener('input', function(e) {
    if (e.target.id === 'adm-search') render();
    if (e.target.id === 'adm-author-search') loadAuthors();
  });

  root.addEventListener('change', function(e) {
    if (e.target.id === 'adm-author-status-filter') loadAuthors();
  });

  // Закрытие drawer — дублирующий обработчик оставляем для совместимости


  // Закрытие confirm по клику на backdrop
  document.addEventListener('click', function(e) {
    var confirm = document.getElementById('adm-confirm');
    if (!confirm) return;
    if (e.target.id === 'adm-confirm-cancel') { confirm.classList.remove('show'); return; }
    if (confirm.classList.contains('show') && e.target === confirm) {
      confirm.classList.remove('show');
    }
  });

  // Закрытие confirm и drawer по Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var confirm = document.getElementById('adm-confirm');
      if (confirm) confirm.classList.remove('show');
      closeDrawer();
    }
  });

  // Восстанавливаем тему
  (function() {
    var saved = localStorage.getItem('adm_theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      var btn = document.getElementById('adm-theme-btn');
      if (btn) btn.textContent = '☀️';
      var logoImg = document.getElementById('adm-logo-img');
      if (logoImg) logoImg.src = 'https://static.tildacdn.com/tild6131-3765-4030-a666-656363633265/_1_1.svg';
    }
  })();

  // Автовход по сохранённому токену
  if (_token) {
    api('GET', '/auth/me')
      .then(function(me) {
        if (!me.is_admin) { _token = ''; localStorage.removeItem('adm_token'); return; }
        showPanel(me.email);
      })
      .catch(function(){ _token = ''; localStorage.removeItem('adm_token'); });
  }
})();
