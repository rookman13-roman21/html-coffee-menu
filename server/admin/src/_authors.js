  // ── AUTHORS ───────────────────────────────────────────────────
  function _admEsc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _authorStatusLabel(status) {
    var labels = {
      submitted: 'На проверке',
      published: 'Опубликован',
      rejected: 'На доработке',
      archived: 'Снят',
    };
    return labels[status] || status || '—';
  }

  function _authorDocumentStatusLabel(status) {
    var labels = {
      not_started: 'Договор пока не нужен',
      pending: 'Договор ожидает',
      requested: 'Договор запрошен',
      ready: 'Договор готов',
      done: 'Договор готов',
      signed: 'Договор подписан',
    };
    return labels[status] || status || 'Договор пока не нужен';
  }

  function _bitrixSyncLabel(a) {
    var status = a.bitrix_sync_status || '';
    if (status === 'synced') return '<span class="adm-bitrix-sync ok">Битрикс: связь есть</span>';
    if (status === 'pending') return '<span class="adm-bitrix-sync pending">Битрикс: в очереди</span>';
    if (status === 'error') return '<span class="adm-bitrix-sync error" title="' + _admEsc(a.bitrix_sync_error || '') + '">Битрикс: ошибка</span>';
    return '<span class="adm-bitrix-sync muted">Битрикс: не связан</span>';
  }

  function _authorContactMarkup(a) {
    if (!a.bitrix_contact_id) return '<span>Битрикс contact не привязан</span>';
    var id = _admEsc(a.bitrix_contact_id);
    return '<a class="adm-author-contact-link" href="https://baristaschool.bitrix24.ru/crm/contact/details/' + id + '/" target="_blank" rel="noopener">Битрикс contact #' + id + '</a>';
  }

  function _authorRecipeAuthorId(r) {
    return Number(r.author_user_id || (r.author && (r.author.user_id || r.author.id)) || 0);
  }

  function _authorRecipeListFor(a) {
    var userId = Number(a.user_id || a.id || 0);
    if (!userId) return [];
    return _author_recipes.filter(function(r){ return _authorRecipeAuthorId(r) === userId; });
  }

  function _authorRecipeCount(a, status) {
    return _authorRecipeListFor(a).filter(function(r){ return r.status === status; }).length;
  }

  function _authorAttentionCount(a) {
    return _authorRecipeListFor(a).filter(function(r){ return r.status === 'submitted' || r.status === 'rejected'; }).length;
  }

  function _authorSortScore(a) {
    return (_authorRecipeCount(a, 'submitted') * 1000) +
      (_authorRecipeCount(a, 'rejected') * 700) +
      ((a.bitrix_sync_status === 'error' || !a.bitrix_contact_id) ? 80 : 0) +
      (Number(a.recipes_count || 0) * 2) +
      Number(a.published_count || 0);
  }

  function _authorQueueCounts() {
    return _author_recipes.reduce(function(acc, r) {
      var status = r.status || 'submitted';
      acc.all += 1;
      acc[status] = (acc[status] || 0) + 1;
      if (Number(r.version || 1) > 1 && status === 'submitted') acc.repeat += 1;
      return acc;
    }, { all: 0, submitted: 0, rejected: 0, published: 0, archived: 0, repeat: 0 });
  }

  function _renderAuthorQueueSummary() {
    var c = _authorQueueCounts();
    return '<div class="adm-author-queue">' +
      '<div class="adm-author-queue-card is-submitted"><strong>' + c.submitted + '</strong><span>На проверке</span></div>' +
      '<div class="adm-author-queue-card is-rejected"><strong>' + c.rejected + '</strong><span>На доработке</span></div>' +
      '<div class="adm-author-queue-card is-repeat"><strong>' + c.repeat + '</strong><span>Повторно</span></div>' +
      '<div class="adm-author-queue-card is-published"><strong>' + c.published + '</strong><span>Опубликовано</span></div>' +
    '</div>';
  }

  function _authorTaskBadges(a) {
    var submitted = _authorRecipeCount(a, 'submitted');
    var rejected = _authorRecipeCount(a, 'rejected');
    var badges = [];
    if (submitted) badges.push('<span class="adm-author-task-badge submitted">На проверке ' + submitted + '</span>');
    if (rejected) badges.push('<span class="adm-author-task-badge rejected">Доработка ' + rejected + '</span>');
    if (a.bitrix_sync_status === 'error') badges.push('<span class="adm-author-task-badge warn">Битрикс ошибка</span>');
    if (!a.bitrix_contact_id) badges.push('<span class="adm-author-task-badge muted">Нет Битрикс</span>');
    return badges.length ? '<div class="adm-author-task-badges">' + badges.join('') + '</div>' : '';
  }

  function _recipeVersionLabel(r) {
    return 'v' + Number(r.version || 1);
  }

  function _recipeMetaLabel(r, authorName) {
    var date = fmtDate(r.updated_at || r.created_at);
    var parts = [authorName, _authorStatusLabel(r.status), _recipeVersionLabel(r)];
    if (date && date !== '—') parts.push('обновлено ' + date);
    return parts.join(' · ');
  }

  function _recipeReviewNote(r) {
    if (r.status === 'submitted' && Number(r.version || 1) > 1) return 'Повторная проверка · ' + _recipeVersionLabel(r);
    if (r.status === 'rejected') return 'Ожидает правок автора';
    if (r.status === 'published') return 'Рецепт уже на витрине';
    if (r.status === 'archived') return 'Публикация снята с витрины';
    return '';
  }

  var AUTHOR_REVIEW_FLAGS = [
    ['basics', 'Основные данные'],
    ['ingredients', 'Ингредиенты'],
    ['photo', 'Фото'],
    ['process', 'Процесс'],
    ['equipment', 'Оборудование'],
    ['serving', 'Подача и срок'],
    ['organoleptic', 'Органолептика'],
    ['description', 'Описание для витрины'],
  ];

  function _authorReviewFlagLabel(flag) {
    var found = AUTHOR_REVIEW_FLAGS.find(function(x){ return x[0] === flag; });
    return found ? found[1] : flag;
  }

  function _authorRecipeById(id) {
    return _author_recipes.find(function(r){ return Number(r.id) === Number(id); });
  }

  function _adminAssetUrl(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src) || String(src).indexOf('data:') === 0) return src;
    return API.replace(/\/api$/, '') + src;
  }

  function _recipeData(r) {
    return (r && r.recipe) || {};
  }

  function _recipeImageUrl(r) {
    var recipe = _recipeData(r);
    return _adminAssetUrl(r.image_url || recipe.image_url || recipe.image || (recipe.draft && recipe.draft.image) || '');
  }

  function _money(v) {
    return Math.round(Number(v || 0)).toLocaleString('ru-RU') + ' ₽';
  }

  function _recipeEquipment(recipe) {
    return (recipe.equipment || [])
      .map(function(item){ return typeof item === 'string' ? item : item && item.name; })
      .filter(Boolean);
  }

  function _recipeIngredients(recipe) {
    return (recipe.ingredients || []).filter(function(row){ return row && Number(row.amt || 0) > 0; });
  }

  function _ingredientText(row) {
    var name = row.name || row.title || row.mat || (row.semi != null ? 'Полуфабрикат #' + row.semi : 'Ингредиент');
    var unit = row.unit || (row.semi != null ? '' : 'г');
    var amount = Number(row.amt || 0);
    var amountText = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
    return _admEsc(name) + ' · ' + _admEsc(amountText) + (unit ? ' ' + _admEsc(unit) : '');
  }

  function _reviewFlagsBadges(flags) {
    flags = flags || [];
    if (!flags.length) return '';
    return '<div class="adm-author-review-flags-inline">' +
      flags.map(function(flag){ return '<span>' + _admEsc(_authorReviewFlagLabel(flag)) + '</span>'; }).join('') +
      '</div>';
  }

  function _recipeBlock(title, body, emptyText) {
    return '<div class="adm-review-block"><h4>' + _admEsc(title) + '</h4>' +
      (body || '<p class="adm-review-muted">' + _admEsc(emptyText || 'Не заполнено') + '</p>') +
      '</div>';
  }

  function _adminReviewChecklist(flags) {
    flags = flags || [];
    return '<div class="adm-review-checklist">' + AUTHOR_REVIEW_FLAGS.map(function(item) {
      var checked = flags.indexOf(item[0]) >= 0 ? ' checked' : '';
      return '<label><input type="checkbox" value="' + _admEsc(item[0]) + '"' + checked + '> ' + _admEsc(item[1]) + '</label>';
    }).join('') + '</div>';
  }

  function _authorEventLabel(type) {
    var labels = {
      submitted: 'Автор отправил рецепт',
      published: 'Рецепт опубликован',
      rejected: 'Возвращено на доработку',
      archived: 'Публикация снята',
      review_saved: 'Проверка сохранена',
    };
    return labels[type] || type || 'Событие';
  }

  function _authorEventsMarkup(events) {
    events = events || [];
    if (!events.length) return '';
    return _recipeBlock('История модерации', '<div class="adm-review-history">' + events.slice(0, 8).map(function(ev) {
      var flags = (ev.review_flags || []).map(function(flag){ return _authorReviewFlagLabel(flag); }).join(', ');
      return '<div class="adm-review-history-item">' +
        '<b>' + _admEsc(_authorEventLabel(ev.event_type)) + (ev.version ? ' · v' + _admEsc(ev.version) : '') + '</b>' +
        '<span>' + _admEsc(fmtDate(ev.created_at)) + (ev.to_status ? ' · ' + _admEsc(_authorStatusLabel(ev.to_status)) : '') + '</span>' +
        (flags ? '<span>Блоки: ' + _admEsc(flags) + '</span>' : '') +
        (ev.comment ? '<p>' + _admEsc(ev.comment) + '</p>' : '') +
      '</div>';
    }).join('') + '</div>', '');
  }

  function _authorVersionsMarkup(versions) {
    versions = versions || [];
    if (!versions.length) return '';
    return _recipeBlock('Версии отправки', '<div class="adm-review-list">' + versions.slice(0, 6).map(function(v) {
      var ok = !v.validation || v.validation.ok !== false;
      return '<span>v' + _admEsc(v.version) + ' · ' + _admEsc(fmtDate(v.created_at)) + ' · ' + (ok ? 'полная' : 'есть пропуски') + '</span>';
    }).join('') + '</div>', '');
  }

  function _authorRecipeFiltersQuery() {
    var params = [];
    var statusEl = document.getElementById('adm-author-status-filter');
    var searchEl = document.getElementById('adm-author-search');
    if (statusEl && statusEl.value) params.push('status=' + encodeURIComponent(statusEl.value));
    if (searchEl && searchEl.value.trim()) params.push('q=' + encodeURIComponent(searchEl.value.trim()));
    return params.length ? '?' + params.join('&') : '';
  }

  function loadAuthors() {
    var aBox = document.getElementById('adm-authors-list');
    var rBox = document.getElementById('adm-author-recipes-list');
    if (aBox) aBox.textContent = 'Загрузка...';
    if (rBox) rBox.textContent = 'Загрузка...';
    Promise.all([
      api('GET', '/admin/authors'),
      api('GET', '/admin/author-recipes' + _authorRecipeFiltersQuery()),
    ])
      .then(function(res) {
        _authors = res[0] || [];
        _author_recipes = res[1] || [];
        renderAuthors();
      })
      .catch(function(e) { toast('❌ Ошибка загрузки авторов: ' + e.message); });
  }

  function renderAuthors() {
    var aBox = document.getElementById('adm-authors-list');
    var rBox = document.getElementById('adm-author-recipes-list');
    if (aBox) {
      var sortedAuthors = _authors.slice().sort(function(a, b) {
        var score = _authorSortScore(b) - _authorSortScore(a);
        if (score) return score;
        return String(a.public_name || a.name || a.email || '').localeCompare(String(b.public_name || b.name || b.email || ''), 'ru');
      });
      aBox.innerHTML = sortedAuthors.length ? sortedAuthors.map(function(a) {
        var canRetry = !a.bitrix_contact_id || a.bitrix_sync_status === 'error';
        var hasTask = _authorAttentionCount(a) > 0 || a.bitrix_sync_status === 'error' || !a.bitrix_contact_id;
        return '<div class="adm-author-row' + (hasTask ? ' has-task' : '') + '">' +
          '<div><b>' + _admEsc(a.public_name || a.name || a.email) + '</b>' +
          '<span>' + _admEsc(a.email) + '</span>' +
          _authorContactMarkup(a) +
          _bitrixSyncLabel(a) +
          _authorTaskBadges(a) +
          (a.bitrix_sync_error ? '<em class="adm-bitrix-error">' + _admEsc(a.bitrix_sync_error) + '</em>' : '') +
          (canRetry ? '<button class="adm-author-sync-btn" data-act="author-sync-bitrix" data-id="' + a.user_id + '">Повторить синхронизацию</button>' : '') +
          '</div>' +
          '<div class="adm-author-meta">' +
            '<span>' + (a.recipes_count || 0) + ' рецептов</span>' +
            '<span>' + (a.published_count || 0) + ' опубликовано</span>' +
            '<span>' + _admEsc(_authorDocumentStatusLabel(a.document_status)) + '</span>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="adm-author-empty">Авторов пока нет</div>';
    }
    if (rBox) {
      var listHtml = _author_recipes.length ? _author_recipes.map(function(r) {
        var authorName = (r.author && (r.author.public_name || r.author.name || r.author.email)) || '—';
        var reviewNote = _recipeReviewNote(r);
        return '<div class="adm-author-recipe-row">' +
          '<div class="adm-author-recipe-main">' +
            '<b>' + _admEsc(r.title) + '</b>' +
            '<span class="adm-author-recipe-meta">' + _admEsc(_recipeMetaLabel(r, authorName)) + '</span>' +
            (reviewNote ? '<span class="adm-author-recipe-note status-' + _admEsc(r.status || 'submitted') + '">' + _admEsc(reviewNote) + '</span>' : '') +
            (r.review_comment ? '<em>' + _admEsc(r.review_comment) + '</em>' : '') +
            _reviewFlagsBadges(r.review_flags || []) +
          '</div>' +
          '<div class="adm-author-recipe-actions">' +
            '<span class="adm-author-status-pill status-' + _admEsc(r.status || 'submitted') + '">' + _admEsc(_authorStatusLabel(r.status)) + '</span>' +
            '<button data-act="author-review-open" data-id="' + r.id + '">Проверить</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="adm-author-empty">Рецептов на публикации пока нет</div>';
      rBox.innerHTML = _renderAuthorQueueSummary() + listHtml;
    }
  }

  function _renderAuthorReview(r) {
    if (!r) return toast('❌ Публикация не найдена');
    _author_review_id = r.id;
    var recipe = _recipeData(r);
    var authorName = (r.author && (r.author.public_name || r.author.name || r.author.email)) || '—';
    var img = _recipeImageUrl(r);
    var ingredients = _recipeIngredients(recipe);
    var equipment = _recipeEquipment(recipe);
    document.getElementById('adm-author-review-title').textContent = r.title || 'Проверка рецепта';
    document.getElementById('adm-author-review-sub').textContent = authorName + ' · ' + _authorStatusLabel(r.status);
    document.getElementById('adm-author-review-body').innerHTML =
      '<div class="adm-review-hero">' +
        '<div class="adm-review-photo">' + (img ? '<img src="' + _admEsc(img) + '" alt="' + _admEsc(r.title) + '">' : '<span>Фото не загружено</span>') + '</div>' +
        '<div class="adm-review-summary">' +
          '<div><b>Автор</b><span>' + _admEsc(authorName) + '</span></div>' +
          '<div><b>Статус</b><span>' + _admEsc(_authorStatusLabel(r.status)) + '</span></div>' +
          '<div><b>Обновлено</b><span>' + _admEsc(fmtDate(r.updated_at || r.created_at)) + '</span></div>' +
          '<div><b>Группа</b><span>' + _admEsc(r.group_name || '—') + '</span></div>' +
          '<div><b>Объём</b><span>' + _admEsc(r.volume_ml || 0) + ' мл</span></div>' +
          '<div><b>Себестоимость</b><span>' + _money(r.cost || 0) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="adm-review-form-grid">' +
        '<label><span>Цена для витрины</span><input id="adm-review-price" type="number" min="0" step="100" value="' + Number(r.price || 0) + '"></label>' +
        '<label><span>Описание для витрины</span><textarea id="adm-review-description" rows="4">' + _admEsc(r.public_description || '') + '</textarea></label>' +
      '</div>' +
      _recipeBlock('Состав', ingredients.length ? '<div class="adm-review-list">' + ingredients.map(function(row){ return '<span>' + _ingredientText(row) + '</span>'; }).join('') + '</div>' : '', 'Состав не передан') +
      _recipeBlock('Оборудование', equipment.length ? '<div class="adm-review-tags">' + equipment.map(function(name){ return '<span>' + _admEsc(name) + '</span>'; }).join('') + '</div>' : '', 'Оборудование не указано') +
      _recipeBlock('Процесс приготовления', recipe.process ? '<p>' + _admEsc(recipe.process) + '</p>' : '', 'Процесс не заполнен') +
      '<div class="adm-review-two">' +
        _recipeBlock('Подача и срок', (recipe.storage_temp || recipe.storage_life) ? '<p><b>Температура:</b> ' + _admEsc(recipe.storage_temp || '—') + '</p><p><b>Срок:</b> ' + _admEsc(recipe.storage_life || '—') + '</p>' : '', 'Условия подачи не заполнены') +
        _recipeBlock('Органолептика', (recipe.appearance || recipe.taste || recipe.consistency) ? '<p><b>Внешний вид:</b> ' + _admEsc(recipe.appearance || '—') + '</p><p><b>Вкус и запах:</b> ' + _admEsc(recipe.taste || '—') + '</p><p><b>Консистенция:</b> ' + _admEsc(recipe.consistency || '—') + '</p>' : '', 'Органолептика не заполнена') +
      '</div>' +
      _recipeBlock('Видео', r.video_url ? '<p><a href="' + _admEsc(r.video_url) + '" target="_blank" rel="noopener">' + _admEsc(r.video_url) + '</a></p>' : '', 'Видео не добавлено') +
      _authorVersionsMarkup(r.versions || []) +
      _authorEventsMarkup(r.events || []) +
      '<div class="adm-review-feedback">' +
        '<h4>Обратная связь автору</h4>' +
        _adminReviewChecklist(r.review_flags || []) +
        '<textarea id="adm-review-comment" rows="4" placeholder="Что автору нужно поправить">' + _admEsc(r.review_comment || '') + '</textarea>' +
        '<div id="adm-review-error"></div>' +
      '</div>';
    document.getElementById('adm-author-review-footer').innerHTML =
      '<button data-act="author-review-save" data-status="">Сохранить без смены статуса</button>' +
      '<button data-act="author-review-save" data-status="published">Опубликовать</button>' +
      '<button data-act="author-review-save" data-status="rejected">Вернуть на доработку</button>' +
      '<button data-act="author-review-save" data-status="archived">Снять</button>';
    document.getElementById('adm-author-review-backdrop').classList.add('show');
    document.getElementById('adm-author-review-drawer').classList.add('open');
  }

  function openAuthorReview(id) {
    var cached = _authorRecipeById(id);
    _author_review_id = id;
    document.getElementById('adm-author-review-title').textContent = cached ? cached.title : 'Проверка рецепта';
    document.getElementById('adm-author-review-sub').textContent = 'Загрузка карточки проверки...';
    document.getElementById('adm-author-review-body').innerHTML = '<div class="adm-author-empty">Загрузка полной карточки рецепта...</div>';
    document.getElementById('adm-author-review-footer').innerHTML = '';
    document.getElementById('adm-author-review-backdrop').classList.add('show');
    document.getElementById('adm-author-review-drawer').classList.add('open');
    api('GET', '/admin/author-recipes/' + id)
      .then(function(full) {
        var idx = _author_recipes.findIndex(function(r){ return Number(r.id) === Number(full.id); });
        if (idx >= 0) _author_recipes[idx] = full;
        else _author_recipes.unshift(full);
        _renderAuthorReview(full);
      })
      .catch(function(e) {
        toast('❌ Ошибка загрузки карточки: ' + e.message);
        closeAuthorReview();
      });
  }

  function closeAuthorReview() {
    _author_review_id = null;
    document.getElementById('adm-author-review-backdrop').classList.remove('show');
    document.getElementById('adm-author-review-drawer').classList.remove('open');
  }

  function _authorReviewFlagsFromForm() {
    return Array.prototype.slice.call(document.querySelectorAll('#adm-author-review-body .adm-review-checklist input:checked'))
      .map(function(input){ return input.value; });
  }

  function updateAuthorRecipeFromReview(status) {
    var id = _author_review_id;
    if (!id) return;
    var commentEl = document.getElementById('adm-review-comment');
    var errorEl = document.getElementById('adm-review-error');
    var flags = _authorReviewFlagsFromForm();
    var comment = commentEl ? commentEl.value.trim() : '';
    if (status === 'rejected' && !comment && !flags.length) {
      if (errorEl) errorEl.textContent = 'Для доработки укажите комментарий или отметьте блоки чеклиста.';
      return;
    }
    api('PATCH', '/admin/author-recipes/' + id, {
      status: status || undefined,
      review_comment: comment,
      review_flags: flags,
      public_description: document.getElementById('adm-review-description') ? document.getElementById('adm-review-description').value : '',
      price: document.getElementById('adm-review-price') ? Number(document.getElementById('adm-review-price').value || 0) : undefined,
    })
      .then(function() {
        toast(status ? '✅ Статус публикации обновлён' : '✅ Проверка сохранена');
        closeAuthorReview();
        loadAuthors();
      })
      .catch(function(e) { toast('❌ ' + e.message); });
  }

  function syncAuthorBitrix(userId) {
    api('POST', '/admin/authors/' + userId + '/sync-bitrix')
      .then(function() {
        toast('✅ Синхронизация с Битрикс запущена');
        setTimeout(loadAuthors, 800);
      })
      .catch(function(e) { toast('❌ ' + e.message); });
  }
