  // ── TAB SWITCH ─────────────────────────────────────────────────
  function switchAdmTab(tab) {
    _tab = tab;
    document.querySelectorAll('.adm-tab').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    var usersSection = document.getElementById('adm-users-section');
    var eqSection = document.getElementById('adm-eq-section');
    var presetsSection = document.getElementById('adm-presets-section');
    var suppliersSection = document.getElementById('adm-suppliers-section');
    var authorsSection = document.getElementById('adm-authors-section');
    if (usersSection) usersSection.style.display = tab === 'users' ? '' : 'none';
    if (eqSection) eqSection.style.display = tab === 'eq' ? '' : 'none';
    if (presetsSection) presetsSection.style.display = tab === 'presets' ? '' : 'none';
    if (suppliersSection) suppliersSection.style.display = tab === 'suppliers' ? '' : 'none';
    if (authorsSection) authorsSection.style.display = tab === 'authors' ? '' : 'none';
    if (tab === 'eq') loadOcLibrary();
    if (tab === 'presets') loadPresets(_preset_format);
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'authors') loadAuthors();
  }
