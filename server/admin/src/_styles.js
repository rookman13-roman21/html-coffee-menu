  // ── INJECT STYLES ──────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap');

    /* ── CSS VARS (light) ── */
    #adm-root {
      --adm-navy:   #417033;
      --adm-green:  #4F883E;
      --adm-light:  #E7F2E3;
      --adm-soft:   #B6D8AB;
      --adm-border: #cde3c5;
      --adm-red:    #CC2841;
      --adm-red-bg: #F8DDE1;
      --adm-bg:     #f5f5f5;
      --adm-card:   #ffffff;
      --adm-text:   #1a1a1a;
      --adm-muted:  #6b7280;
      --adm-input:  #fafaf9;
      --adm-row-hover: #f0f7f0;
      --adm-thead:  #4F883E;
    }

    /* ── CSS VARS (dark) — применяется когда body имеет класс .dark ── */
    body.dark #adm-root {
      --adm-navy:   #91dc8b;
      --adm-green:  #6fc66c;
      --adm-light:  #2b3229;
      --adm-soft:   #40553a;
      --adm-border: #3f453f;
      --adm-red:    #f08b9a;
      --adm-red-bg: #321f24;
      --adm-bg:     #191919;
      --adm-card:   #242424;
      --adm-text:   #e8e8e8;
      --adm-muted:  #a4a7ad;
      --adm-input:  #333333;
      --adm-row-hover: #2b302a;
      --adm-thead:  #30362e;
    }

    #adm-root * { box-sizing: border-box; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; }
    #adm-root {
      width: 100vw;
      max-width: none;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
      padding: 28px 20px 60px;
      background: var(--adm-bg);
      min-height: 100vh;
      color: var(--adm-text);
    }

    /* ── LOGIN ── */
    #adm-login { max-width: 400px; margin: 60px auto 0; background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    #adm-login h2 { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: var(--adm-navy); }
    #adm-login p  { margin: 0 0 24px; font-size: 14px; color: var(--adm-muted); }
    .adm-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .adm-field label { font-size: 13px; font-weight: 700; color: var(--adm-muted); }
    .adm-field input { border: 1.5px solid var(--adm-border); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; background: var(--adm-input); color: var(--adm-text); transition: border-color .15s; width: 100%; font-family: inherit; }
    .adm-field input:focus { border-color: var(--adm-navy); background: var(--adm-card); box-shadow: 0 0 0 3px rgba(65,112,51,.12); }
    #adm-login-btn { width: 100%; padding: 12px; background: var(--adm-navy); color: #fff; border: none; border-radius: 11px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 6px; transition: opacity .15s, transform .12s; font-family: inherit; }
    #adm-login-btn:hover { opacity: .88; transform: translateY(-1px); }
    #adm-login-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    #adm-login-err { color: var(--adm-red); font-size: 13px; margin-top: 10px; text-align: center; min-height: 18px; }
    #adm-forgot-row { text-align: right; margin-top: 4px; }
    #adm-forgot-link { background: none; border: none; padding: 0; font-size: 12px; color: var(--adm-navy); cursor: pointer; font-family: inherit; text-decoration: underline; text-underline-offset: 2px; opacity: .75; }
    #adm-forgot-link:hover { opacity: 1; }
    #adm-forgot-form { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--adm-border); display: none; }
    #adm-forgot-form p { font-size: 13px; color: var(--adm-muted); margin: 0 0 12px; }
    #adm-forgot-btn { width: 100%; padding: 11px; background: var(--adm-green); color: #fff; border: none; border-radius: 11px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; transition: opacity .15s; }
    #adm-forgot-btn:hover { opacity: .88; }
    #adm-forgot-btn:disabled { opacity: .5; cursor: not-allowed; }
    #adm-forgot-result { font-size: 13px; margin-top: 10px; text-align: center; min-height: 18px; }

    /* ── PANEL HEADER ── */
    #adm-panel { display: none; width: 100%; max-width: 1100px; margin: 0 auto; }
    .adm-topbar {
      background: var(--adm-navy); color: #fff;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 22px; height: 58px; border-radius: 12px; margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,.15);
    }
    body.dark .adm-topbar { background: #2c2c2c; box-shadow: 0 2px 12px rgba(0,0,0,.45); border:1px solid #3b3b3b; }
    .adm-topbar-brand { display: flex; align-items: center; gap: 10px; }
    .adm-topbar-brand span { font-size: 16px; font-weight: 800; letter-spacing: -.01em; }
    #adm-logo-img { height: 30px; width: auto; display: block; }
    body.dark #adm-logo-img { filter: brightness(0) invert(1); opacity: .78; }
    .adm-topbar-right { display: flex; align-items: center; gap: 10px; }
    #adm-me { font-size: 12px; opacity: .75; }
    #adm-theme-btn, #adm-logout {
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
      border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 700;
      cursor: pointer; color: rgba(255,255,255,.85); font-family: inherit;
      transition: background .15s;
    }
    #adm-theme-btn:hover, #adm-logout:hover { background: rgba(255,255,255,.22); color: #fff; }

    /* ── KPI STATS ── */
    .adm-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 10px; margin-bottom: 20px; }
    .adm-stat { background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 12px; padding: 14px 18px; box-shadow: 0 1px 4px rgba(0,0,0,.05); display: flex; flex-direction: column; justify-content: space-between; min-height: 76px; }
    .adm-stat-val { font-size: 26px; font-weight: 800; color: var(--adm-navy); line-height: 1; margin-bottom: 6px; }
    .adm-stat-lbl { font-size: 11px; font-weight: 700; color: var(--adm-muted); text-transform: none; }
    .adm-stat.s-active .adm-stat-val { color: #2d8a56; }
    body.dark .adm-stat.s-active .adm-stat-val { color: #89d185; }
    .adm-stat.s-wait .adm-stat-val { color: #e07b00; }
    body.dark .adm-stat.s-wait .adm-stat-val { color: #d7ba7d; }
    .adm-stat.s-admin .adm-stat-val { color: #6c3fc5; }
    body.dark .adm-stat.s-admin .adm-stat-val { color: #b39ddb; }
    .adm-stat.s-online .adm-stat-val { color: var(--adm-navy); }

    /* ── TOOLBAR ── */
    .adm-toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
    .adm-search { flex: 1; min-width: 180px; border: 1.5px solid var(--adm-border); border-radius: 10px; padding: 9px 12px; font-size: 14px; outline: none; background: var(--adm-card); color: var(--adm-text); font-family: inherit; transition: border-color .15s; }
    .adm-search:focus { border-color: var(--adm-navy); box-shadow: 0 0 0 3px rgba(65,112,51,.1); }
    .adm-filter-btns { display: flex; gap: 5px; flex-wrap: wrap; }
    .adm-fb { border: 1.5px solid var(--adm-border); background: var(--adm-card); border-radius: 8px; padding: 7px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--adm-muted); transition: all .15s; font-family: inherit; }
    .adm-fb:hover { border-color: var(--adm-navy); color: var(--adm-navy); }
    .adm-fb.active { background: var(--adm-navy); border-color: var(--adm-navy); color: #fff; }
    body.dark .adm-fb.active { background: #1e3a28; border-color: #3e6b3a; color: #89d185; }
    #adm-csv-btn { background: var(--adm-light); border: 1px solid var(--adm-soft); border-radius: 9px; padding: 8px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--adm-navy); font-family: inherit; transition: opacity .15s; }
    #adm-csv-btn:hover { opacity: .8; }
    #adm-refresh { background: var(--adm-card); border: 1.5px solid var(--adm-border); border-radius: 9px; padding: 8px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--adm-muted); font-family: inherit; transition: all .15s; }
    #adm-refresh:hover { border-color: var(--adm-navy); color: var(--adm-navy); }

    /* ── TABLE ── */
    .adm-table-wrap { background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 12px; overflow: hidden; overflow-x: auto; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
    table.adm-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 860px; font-size: 13px; }
    table.adm-table thead th {
      background: var(--adm-thead); color: #fff; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
      padding: 11px 14px; text-align: left; white-space: nowrap;
      box-shadow: 0 2px 0 rgba(0,0,0,.1);
    }
    table.adm-table thead th:first-child { border-radius: 12px 0 0 0; }
    table.adm-table thead th:last-child  { border-radius: 0 12px 0 0; }
    table.adm-table th[data-sort] { cursor: pointer; user-select: none; }
    table.adm-table th[data-sort]:hover { background: rgba(0,0,0,.15); }
    table.adm-table tbody td { padding: 11px 14px; color: var(--adm-text); border-bottom: 1px solid var(--adm-light); vertical-align: middle; }
    body.dark table.adm-table tbody td { border-bottom-color: #3c3c3c; }
    table.adm-table tbody tr:last-child td { border-bottom: none; }
    table.adm-table tbody tr:hover td { background: var(--adm-row-hover); }

    /* ── BADGES ── */
    .adm-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 3px 9px; white-space: nowrap; }
    .adm-badge.active   { background: #E7F2E3; color: #2d8a56; }
    .adm-badge.inactive { background: var(--adm-red-bg); color: var(--adm-red); }
    .adm-badge.admin    { background: #ede9ff; color: #6c3fc5; }
    .adm-badge.online   { background: #E7F2E3; color: #2d8a56; }
    body.dark .adm-badge.active, body.dark .adm-badge.online { background: #1e3a28; color: #89d185; }
    body.dark .adm-badge.inactive { background: #2d1a18; color: #f48771; }
    body.dark .adm-badge.admin    { background: #2a1f3d; color: #b39ddb; }

    /* ── ACTION BUTTONS ── */
    .adm-actions { display: flex; gap: 5px; flex-wrap: wrap; }
    .adm-btn { border: none; border-radius: 7px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: opacity .15s, transform .1s; white-space: nowrap; font-family: inherit; }
    .adm-btn:hover { opacity: .78; transform: translateY(-1px); }
    .adm-btn.on  { background: #E7F2E3; color: #2d8a56; }
    .adm-btn.off { background: var(--adm-red-bg); color: var(--adm-red); }
    .adm-btn.del { background: var(--adm-light); color: var(--adm-muted); }
    .adm-btn.adm { background: #ede9ff; color: #6c3fc5; }
    body.dark .adm-btn.on  { background: #1e3a28; color: #89d185; }
    body.dark .adm-btn.off { background: #2d1a18; color: #f48771; }
    .adm-btn.reset { background: #fff4e0; color: #b45309; }
    body.dark .adm-btn.reset { background: #2d1f0a; color: #d7ba7d; }

    /* ── AVATAR ── */
    .adm-av { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; font-size: 12px; font-weight: 800; color: #fff; flex-shrink: 0; }

    /* ── LOADING ── */
    #adm-loading { text-align: center; padding: 40px; color: var(--adm-muted); font-size: 14px; }

    /* ── PAGINATION ── */
    #adm-pagination { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 12px 14px; border-top: 1px solid var(--adm-border); background: var(--adm-card); }
    body.dark #adm-pagination { border-top-color: #3c3c3c; }
    .adm-pag-btn { border: 1.5px solid var(--adm-border); background: var(--adm-card); border-radius: 7px; padding: 5px 11px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--adm-muted); font-family: inherit; transition: all .15s; }
    .adm-pag-btn:hover { border-color: var(--adm-navy); color: var(--adm-navy); }
    .adm-pag-btn.active { background: var(--adm-navy); border-color: var(--adm-navy); color: #fff; }
    body.dark .adm-pag-btn.active { background: #1e3a28; border-color: #3e6b3a; color: #89d185; }
    .adm-pag-btn:disabled { opacity: .35; cursor: not-allowed; }
    #adm-pag-info { font-size: 12px; color: var(--adm-muted); margin-left: auto; }

    /* ── CONFIRM MODAL ── */
    #adm-confirm { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); z-index: 9999; align-items: center; justify-content: center; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; }
    #adm-confirm.show { display: flex; }
    #adm-confirm *, #adm-confirm *::before, #adm-confirm *::after { box-sizing: border-box; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; }
    #adm-confirm-box { background: var(--adm-card,#fff); border: 1.5px solid var(--adm-border,#e8eaed); border-radius: 18px; padding: 28px 28px 24px; max-width: 380px; width: 90%; box-shadow: 0 12px 48px rgba(0,0,0,.16); }
    body.dark #adm-confirm-box { background: #1e2021; border-color: #3a3a3a; }
    #adm-confirm-box h3 { margin: 0 0 10px; font-size: 17px; font-weight: 800; color: var(--adm-navy,#417033); font-family: 'Mulish', sans-serif; }
    body.dark #adm-confirm-box h3 { color: #89d185; }
    #adm-confirm-box p  { margin: 0 0 24px; font-size: 14px; color: var(--adm-text,#333); line-height: 1.55; font-family: 'Mulish', sans-serif; }
    body.dark #adm-confirm-box p  { color: #a0a0a0; }
    .adm-confirm-btns { display: flex; gap: 10px; }
    .adm-confirm-btns button { flex: 1; padding: 11px; border: none; border-radius: 11px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; transition: opacity .15s, transform .1s; }
    .adm-confirm-btns button:hover { opacity: .88; transform: translateY(-1px); }
    .adm-confirm-btns button:active { transform: translateY(0); }
    #adm-confirm-cancel { background: var(--adm-light,#f4f6f8); color: var(--adm-muted,#888); border: 1.5px solid var(--adm-border,#e8eaed) !important; }
    body.dark #adm-confirm-cancel { background: #2a2a2a; border-color: #3a3a3a !important; color: #888; }
    #adm-confirm-ok { background: var(--adm-red,#cc4444); color: #fff; }

    /* ── TOAST ── */
    #adm-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(12px); background: #1a1a1a; color: #fff; font-size: 13px; font-weight: 700; border-radius: 999px; padding: 10px 22px; opacity: 0; transition: opacity .2s, transform .2s; pointer-events: none; z-index: 99999; white-space: nowrap; font-family: 'Mulish', sans-serif; }
    #adm-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    body.dark #adm-toast { background: #333; border: 1px solid #454545; }

    /* ── SLIM TABLE ── */
    table.adm-table { min-width: 480px; }
    table.adm-table tbody tr { cursor: pointer; }
    .adm-row-actions { display: flex; gap: 4px; }
    .adm-icon-btn { border: none; background: transparent; border-radius: 7px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; transition: background .15s; }
    .adm-icon-btn:hover { background: var(--adm-light); }
    .adm-icon-btn.off:hover { background: var(--adm-red-bg); }

    /* ── USER DRAWER ── */
    #adm-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.32); backdrop-filter: blur(2px); z-index: 9990; opacity: 0; pointer-events: none; transition: opacity .22s; }
    #adm-drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    #adm-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 100vw; background: #fff; box-shadow: -6px 0 40px rgba(0,0,0,.12); z-index: 9991; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .28s cubic-bezier(.4,0,.2,1); font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #adm-drawer *, #adm-drawer *::before, #adm-drawer *::after { box-sizing: border-box; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    body.dark #adm-drawer { background: #1e1e1e; }
    #adm-drawer.open { transform: translateX(0); }

    /* Шапка drawer */
    #adm-drawer-head { display: flex; align-items: center; gap: 14px; padding: 20px 22px 18px; border-bottom: 1px solid var(--adm-border); flex-shrink: 0; background: var(--adm-navy); }
    body.dark #adm-drawer-head { border-bottom-color: #3c3c3c; background: #2d2d2d; }
    #adm-drawer-av { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 800; color: rgba(255,255,255,.9); flex-shrink: 0; border: 2px solid rgba(255,255,255,.25); background: rgba(255,255,255,.18); }
    #adm-drawer-head-text { flex: 1; min-width: 0; }
    #adm-drawer-name { font-size: 16px; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -.01em; }
    #adm-drawer-email { font-size: 12px; color: rgba(255,255,255,.65); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #adm-drawer-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,.15); cursor: pointer; color: rgba(255,255,255,.8); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; font-family: inherit; transition: background .15s; line-height: 1; }
    #adm-drawer-close:hover { background: rgba(255,255,255,.28); color: #fff; }

    /* Тело drawer — чистый список без карточек */
    #adm-drawer-body { flex: 1; overflow-y: auto; padding: 8px 0; display: flex; flex-direction: column; }
    .adm-drawer-row { display: flex; align-items: center; gap: 14px; padding: 13px 22px; border-bottom: 1px solid #f0f0f0; transition: background .12s; }
    body.dark .adm-drawer-row { border-bottom-color: #2d2d2d; }
    .adm-drawer-row:last-child { border-bottom: none; }
    .adm-drawer-row-icon { font-size: 17px; flex-shrink: 0; width: 28px; text-align: center; opacity: .7; }
    .adm-drawer-row-content { flex: 1; min-width: 0; }
    .adm-drawer-row-label { font-size: 10px; font-weight: 700; color: var(--adm-muted); text-transform: uppercase; letter-spacing: .07em; margin-bottom: 3px; }
    .adm-drawer-row-val { font-size: 14px; font-weight: 600; color: var(--adm-text); word-break: break-all; line-height: 1.3; }
    .adm-drawer-notes-row { align-items: flex-start; }
    .adm-drawer-notes-ta { width: 100%; min-height: 80px; max-height: 200px; resize: vertical; border: 1.5px solid var(--adm-border); border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: 'Mulish', sans-serif; color: var(--adm-text); background: var(--adm-card); line-height: 1.5; outline: none; box-sizing: border-box; margin-top: 4px; transition: border-color .15s; }
    .adm-drawer-notes-ta:focus { border-color: var(--adm-green); }
    .adm-drawer-notes-status { font-size: 11px; color: var(--adm-green); margin-top: 3px; min-height: 14px; }
    .adm-drawer-access-row { align-items: flex-start; }
    .adm-access-toggle { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 0; border-top: 1px solid #f0f0f0; cursor: pointer; }
    .adm-access-toggle:first-of-type { border-top: none; }
    body.dark .adm-access-toggle { border-top-color: #2d2d2d; }
    .adm-access-toggle span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .adm-access-toggle b { font-size: 14px; color: var(--adm-text); }
    .adm-access-toggle em { font-style: normal; font-size: 11px; color: var(--adm-muted); line-height: 1.35; }
    .adm-access-toggle input { width: 42px; height: 24px; flex-shrink: 0; accent-color: var(--adm-green); cursor: pointer; }
    .adm-access-toggle input:disabled { opacity: .55; cursor: not-allowed; }
    .adm-access-note { margin-top: 4px; font-size: 11px; color: var(--adm-muted); }
    .adm-access-badges { display: flex; flex-wrap: wrap; gap: 5px; }
    .adm-access-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 800; line-height: 1; white-space: nowrap; }
    .adm-access-badge.on { background: #E7F2E3; color: #2d7a46; }
    .adm-access-badge.off { background: #f5f5f5; color: #999; }
    body.dark .adm-access-badge.on { background: #1e3a28; color: #89d185; }
    body.dark .adm-access-badge.off { background: #2d2d2d; color: #777; }

    /* Футер drawer — кнопки действий */
    #adm-drawer-footer { padding: 14px 16px; border-top: 1px solid var(--adm-border); display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex-shrink: 0; }
    body.dark #adm-drawer-footer { border-top-color: #3c3c3c; }
    .adm-drawer-btn { padding: 10px 14px; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Mulish', sans-serif; transition: opacity .15s, transform .1s; display: flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap; }
    .adm-drawer-btn:hover { opacity: .82; transform: translateY(-1px); }
    .adm-drawer-btn:active { transform: translateY(0); }
    .adm-drawer-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    .adm-drawer-btn.on    { background: #E7F2E3; color: #2d7a46; }
    .adm-drawer-btn.off   { background: #fde8ec; color: #b0152e; }
    .adm-drawer-btn.reset { background: #fff4e0; color: #a05c00; }
    .adm-drawer-btn.adm   { background: #ede9ff; color: #5c2fc4; }
    .adm-drawer-btn.del   { background: #f5f5f5; color: #888; grid-column: span 2; }
    body.dark .adm-drawer-btn.on  { background: #1e3a28; color: #89d185; }
    body.dark .adm-drawer-btn.off { background: #2d1a18; color: #f48771; }
    body.dark .adm-drawer-btn.del { background: #2d2d2d; color: #777; }

    /* ── RESPONSIVE ── */
    @media (max-width: 600px) {
      #adm-root { padding: 12px 10px 40px; }
      .adm-topbar { border-radius: 10px; padding: 0 14px; }
      .adm-stats { grid-template-columns: repeat(3, 1fr); }
      .adm-filter-btns { display: none; }
    }

    /* ── TABS ── */
    .adm-tabs { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid var(--adm-border); }
    .adm-tab { background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -2px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; color: var(--adm-muted); font-family: inherit; transition: color .15s, border-color .15s; }
    .adm-tab:hover { color: var(--adm-navy); }
    .adm-tab.active { color: var(--adm-navy); border-bottom-color: var(--adm-navy); }

    /* ── EQUIPMENT TOOLBAR ── */
    .adm-eq-toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
    #adm-eq-search { flex: 1; min-width: 160px; border: 1.5px solid var(--adm-border); border-radius: 10px; padding: 9px 12px; font-size: 14px; outline: none; background: var(--adm-card); color: var(--adm-text); font-family: inherit; transition: border-color .15s; }
    #adm-eq-search:focus { border-color: var(--adm-navy); box-shadow: 0 0 0 3px rgba(65,112,51,.1); }
    /* Library filter tabs */
    .adm-lib-tabs-wrap { margin-bottom: 12px; }
    .adm-lib-main-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .adm-lib-sub-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; padding-top: 10px; border-top: 1.5px solid var(--adm-border); }
    .adm-eq-coverage { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: -2px 0 12px; padding: 10px 12px; border: 1.5px solid var(--adm-border); border-radius: 12px; background: var(--adm-soft); color: var(--adm-muted); font-size: 12px; }
    .adm-eq-coverage-main { color: var(--adm-text); font-weight: 800; }
    .adm-eq-coverage-empty { line-height: 1.4; }
    .adm-eq-coverage-done { color: var(--adm-navy); font-weight: 700; }
    .adm-eq-context { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding: 9px 11px; border-radius: 10px; background: var(--adm-light); color: var(--adm-muted); font-size: 12px; }
    .adm-eq-context-label { color: var(--adm-navy); font-weight: 800; }
    .adm-lib-tab { display: inline-flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 20px; border: 1.5px solid var(--adm-border); background: var(--adm-card); color: var(--adm-muted); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; white-space: nowrap; }
    .adm-lib-tab:hover { border-color: var(--adm-navy); color: var(--adm-navy); }
    .adm-lib-tab.active { background: var(--adm-navy); color: #fff; border-color: var(--adm-navy); }
    .adm-lib-tab .tab-cnt { font-size: 10px; font-weight: 700; background: rgba(0,0,0,.1); border-radius: 20px; padding: 1px 6px; line-height: 1.4; }
    .adm-lib-tab.active .tab-cnt { background: rgba(255,255,255,.25); }
    #adm-eq-add-btn { background: var(--adm-navy); color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; white-space: nowrap; }
    #adm-eq-add-btn:hover { opacity: .85; }
    #adm-eq-bulk-del { background: var(--adm-red-bg); color: var(--adm-red); border: 1.5px solid var(--adm-red); border-radius: 9px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; }
    #adm-eq-bulk-del:hover { opacity: .8; }

    /* ── EQUIPMENT TABLE ── */
    #adm-eq-table { min-width: 680px; }
    .adm-eq-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--adm-border); background: var(--adm-bg); display: block; }
    .adm-eq-thumb-empty { width: 44px; height: 44px; border-radius: 8px; border: 1px dashed var(--adm-border); background: var(--adm-bg); display: flex; align-items: center; justify-content: center; font-size: 18px; }
    #adm-eq-tbody tr[data-eq-id] { cursor: pointer; }
    #adm-eq-tbody tr[data-eq-id]:hover td { background: var(--adm-soft) !important; }
    .adm-eq-cat-row td { background: var(--adm-light) !important; font-weight: 700; padding: 7px 12px; font-size: 11px; color: var(--adm-muted); letter-spacing: .06em; text-transform: uppercase; position: sticky; top: 48px; z-index: 1; border-top: 2px solid var(--adm-border); }
    .adm-eq-empty-row td { padding: 0 !important; }
    .adm-eq-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; min-height: 160px; padding: 28px 18px; text-align: center; color: var(--adm-muted); background: var(--adm-card); }
    .adm-eq-empty-title { color: var(--adm-text); font-size: 16px; font-weight: 800; }
    .adm-eq-empty-text { max-width: 460px; font-size: 13px; line-height: 1.45; }
    .adm-eq-empty-add { background: var(--adm-navy); color: #fff; border: none; border-radius: 9px; padding: 9px 15px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; }
    .adm-eq-empty-add:hover { opacity: .86; }
    body.dark .adm-eq-cat-row td { background: #2a2a2a !important; color: #888; }
    .adm-eq-link { color: var(--adm-navy); text-decoration: none; font-size: 12px; }
    .adm-eq-link:hover { text-decoration: underline; }
    .adm-eq-price { font-size: 13px; font-weight: 700; color: var(--adm-text); white-space: nowrap; }
    .adm-eq-name { font-weight: 700; font-size: 13px; color: var(--adm-text); max-width: 340px; }
    .adm-eq-cat  { font-size: 11px; font-weight: 700; background: var(--adm-light); color: var(--adm-navy); border-radius: 6px; padding: 2px 8px; display: inline-block; }
    .adm-eq-check { width: 16px; height: 16px; cursor: pointer; accent-color: var(--adm-navy); }
    .adm-eq-actions { display: flex; align-items: center; gap: 3px; flex-wrap: nowrap; }
    .adm-drag-handle { cursor: grab; color: #ccc; font-size: 16px; user-select: none; padding: 3px 4px; border-radius: 5px; transition: color .15s, background .15s; }
    .adm-drag-handle:hover { color: var(--adm-navy); background: var(--adm-light); }
    tr:hover .adm-drag-handle { color: #aaa; }

    /* ── EQUIPMENT DRAWER ── */
    #adm-eq-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw; background: #fff; box-shadow: -6px 0 40px rgba(0,0,0,.12); z-index: 9991; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .28s cubic-bezier(.4,0,.2,1); overflow: hidden; height: 100dvh; height: 100vh; }
    #adm-eq-drawer *, #adm-eq-drawer *::before, #adm-eq-drawer *::after { box-sizing: border-box; font-family: 'Mulish', sans-serif; }
    body.dark #adm-eq-drawer { background: #1e1e1e; }
    #adm-eq-drawer.open { transform: translateX(0); }
    .adm-badge { display:inline-block;font-size:12px;vertical-align:middle;margin-left:2px; }
    tr.adm-drag-over td { background:#e8f5e1 !important; }
    #adm-eq-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.32); backdrop-filter: blur(2px); z-index: 9990; opacity: 0; pointer-events: none; transition: opacity .22s; }
    #adm-eq-drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    #adm-sup-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.32); backdrop-filter: blur(2px); z-index: 9990; opacity: 0; pointer-events: none; transition: opacity .22s; }
    #adm-sup-drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    #adm-sup-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw; background: #fff; box-shadow: -6px 0 40px rgba(0,0,0,.12); z-index: 9991; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .28s cubic-bezier(.4,0,.2,1); font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; }
    body.dark #adm-sup-drawer { background: #1e1e1e; }
    #adm-sup-drawer *, #adm-sup-drawer *::before, #adm-sup-drawer *::after { box-sizing: border-box; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif; }
    #adm-sup-drawer.open { transform: translateX(0); }
    .adm-sup-filter { background: var(--adm-card); border: 1.5px solid var(--adm-border); color: var(--adm-text); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: 'Mulish', sans-serif; }
    .adm-sup-filter:hover { border-color: var(--adm-green); color: var(--adm-green); }
    .adm-sup-filter.active { background: var(--adm-green); border-color: var(--adm-green); color: #fff; }
    body.dark .adm-sup-filter { background: #2a2a2a; border-color: #3c3c3c; color: #ccc; }
    body.dark .adm-sup-filter.active { background: var(--adm-green); color: #fff; border-color: var(--adm-green); }
    #adm-sup-logo-preview { margin-top: 8px; display: none; width: 64px; height: 64px; object-fit: contain; border-radius: 10px; border: 1.5px solid var(--adm-border); padding: 4px; background: var(--adm-card); }
    .adm-sup-section-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--adm-muted); margin: 4px 0 -4px; }
    #adm-sup-drawer #adm-eq-drawer-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 16px; border-bottom: 1px solid #cde3c5; flex-shrink: 0; background: #417033; }
    #adm-sup-drawer #adm-eq-drawer-body { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    #adm-sup-drawer #adm-eq-drawer-footer { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid #cde3c5; flex-shrink: 0; background: #fff; }
    body.dark #adm-sup-drawer #adm-eq-drawer-footer { background: #1e1e1e; border-top-color: #3c3c3c; }
    #adm-eq-drawer-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 16px; border-bottom: 1px solid #cde3c5; flex-shrink: 0; background: #417033; }
    body.dark #adm-eq-drawer-head { background: #2d2d2d; border-bottom-color: #3c3c3c; }
    #adm-eq-drawer-title { flex: 1; font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
    #adm-eq-drawer-close { width: 30px; height: 30px; border-radius: 7px; border: none; background: rgba(255,255,255,.15); cursor: pointer; color: rgba(255,255,255,.85); font-size: 16px; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: background .15s; line-height: 1; }
    #adm-eq-drawer-close:hover { background: rgba(255,255,255,.28); color: #fff; }
    #adm-eq-drawer-body { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .adm-eq-field { display: flex; flex-direction: column; gap: 5px; }
    .adm-eq-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #fafaf9; border: 1.5px solid #cde3c5; border-radius: 10px; cursor: pointer; gap: 12px; }
    .adm-eq-toggle-row:hover { border-color: #417033; background: #f5fbf2; }
    .adm-eq-toggle-info { display: flex; flex-direction: column; gap: 2px; }
    .adm-eq-toggle-title { font-size: 13px; font-weight: 600; color: #1a1a1a; }
    .adm-eq-toggle-desc { font-size: 11px; color: #9ca3af; }
    .adm-eq-toggle-switch { position: relative; width: 38px; height: 22px; flex-shrink: 0; }
    .adm-eq-toggle-switch input { opacity: 0; width: 0; height: 0; }
    .adm-eq-toggle-slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 11px; transition: background .2s; cursor: pointer; }
    .adm-eq-toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
    .adm-eq-toggle-switch input:checked + .adm-eq-toggle-slider { background: #417033; }
    .adm-eq-toggle-switch input:checked + .adm-eq-toggle-slider::before { transform: translateX(16px); }
    .adm-eq-field label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; }
    .adm-eq-field input, .adm-eq-field select { border: 1.5px solid #cde3c5; border-radius: 9px; padding: 9px 12px; font-size: 14px; font-family: inherit; outline: none; background: #fafaf9; color: #1a1a1a; width: 100%; transition: border-color .15s; -webkit-appearance: none; appearance: none; }
    .adm-eq-field select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
    .adm-eq-field input:focus, .adm-eq-field select:focus { border-color: #417033; background: #fff; box-shadow: 0 0 0 3px rgba(65,112,51,.1); }
    #adm-eq-photo-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; border: 1.5px solid #cde3c5; margin-top: 6px; display: none; background: #f5f5f5; }
    #adm-eq-ai-btn { background: #6c3fc5; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
    #adm-eq-ai-btn:hover { opacity: .82; }
    #adm-eq-ai-btn:disabled { opacity: .45; cursor: not-allowed; }
    #adm-eq-drawer-footer { padding: 14px 20px; border-top: 2px solid #cde3c5; display: flex; gap: 8px; flex-shrink: 0; background: #fff; }
    body.dark #adm-eq-drawer-footer { border-top-color: #3c3c3c; background: #1e1e1e; }
    .adm-eq-footer-btn { flex: 1; padding: 13px; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s; }
    .adm-eq-footer-btn:hover { opacity: .85; transform: translateY(-1px); }
    .adm-eq-footer-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .adm-eq-footer-btn.save { background: #417033; color: #fff; }
    .adm-eq-footer-btn.cancel { background: #E7F2E3; color: #417033; }
    .adm-new-cat-row { display: flex; gap: 6px; margin-top: 6px; }
    .adm-new-cat-row input { flex: 1; border: 1.5px solid #cde3c5; border-radius: 9px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; background: #fafaf9; color: #1a1a1a; }
    .adm-new-cat-row input:focus { border-color: #417033; box-shadow: 0 0 0 2px rgba(65,112,51,.1); }
    .adm-new-cat-row button { background: #E7F2E3; border: 1px solid #cde3c5; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #417033; font-family: inherit; white-space: nowrap; }
    .adm-new-cat-row button:hover { background: #B6D8AB; }
    .adm-eq-footer-btn.cancel { background: #E7F2E3; color: #417033; }
    .adm-new-cat-row { display: flex; gap: 6px; margin-top: 6px; }
    .adm-new-cat-row input { flex: 1; border: 1.5px solid #cde3c5; border-radius: 9px; padding: 7px 10px; font-size: 13px; font-family: inherit; outline: none; background: #fafaf9; color: #1a1a1a; }
    .adm-new-cat-row input:focus { border-color: #417033; box-shadow: 0 0 0 2px rgba(65,112,51,.1); }
    .adm-new-cat-row button { background: #E7F2E3; border: 1px solid #cde3c5; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #417033; font-family: inherit; white-space: nowrap; }
    .adm-new-cat-row button:hover { background: #B6D8AB; }
    @keyframes adm-spin { to { transform: rotate(360deg); } }
    .adm-ai-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:adm-spin .7s linear infinite; vertical-align:middle; margin-right:5px; }

    /* ── SUBCAT MANAGER MODAL ── */
    .adm-scm-backdrop { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); font-family:'Mulish',-apple-system,BlinkMacSystemFont,sans-serif; }
    .adm-scm-dialog { background:var(--adm-card,#fff); border-radius:16px; width:440px; max-width:95vw; max-height:84vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,.2); border:1px solid var(--adm-border,#cde3c5); }
    .adm-scm-header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 14px; border-bottom:1px solid var(--adm-border,#e8e6e1); }
    .adm-scm-title { font-size:15px; font-weight:800; color:var(--adm-text,#1a1a1a); margin:0; }
    .adm-scm-sub { font-size:12px; color:var(--adm-muted,#888); margin-top:2px; }
    .adm-scm-close { width:30px; height:30px; border:none; background:var(--adm-light,#E7F2E3); border-radius:8px; cursor:pointer; font-size:14px; color:var(--adm-navy,#417033); display:flex; align-items:center; justify-content:center; font-family:inherit; transition:background .15s; }
    .adm-scm-close:hover { background:var(--adm-soft,#B6D8AB); }
    .adm-scm-list { flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:4px; }
    .adm-scm-empty { text-align:center; color:var(--adm-muted,#aaa); font-size:13px; padding:24px 0; }
    .adm-scm-row { display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:9px; background:var(--adm-input,#fafaf9); border:1px solid transparent; transition:border-color .15s; }
    .adm-scm-row:hover { border-color:var(--adm-border,#cde3c5); }
    .adm-scm-num { color:var(--adm-muted,#bbb); font-size:11px; font-weight:700; width:20px; text-align:right; flex-shrink:0; }
    .adm-scm-lbl { flex:1; font-size:13px; font-weight:600; color:var(--adm-text,#1a1a1a); }
    .adm-scm-rename-inp { flex:1; border:1.5px solid var(--adm-navy,#417033); border-radius:7px; padding:4px 8px; font-size:13px; font-family:inherit; outline:none; background:var(--adm-card,#fff); color:var(--adm-text,#1a1a1a); box-shadow:0 0 0 2px rgba(65,112,51,.1); }
    .adm-scm-btn-edit { width:28px; height:28px; border:none; background:var(--adm-light,#E7F2E3); cursor:pointer; color:var(--adm-navy,#417033); font-size:13px; border-radius:7px; padding:0; flex-shrink:0; transition:background .15s; }
    .adm-scm-btn-edit:hover { background:var(--adm-soft,#B6D8AB); }
    .adm-scm-btn-save { width:28px; height:28px; border:none; background:var(--adm-navy,#417033); color:#fff; cursor:pointer; font-size:14px; border-radius:7px; padding:0; flex-shrink:0; transition:opacity .15s; }
    .adm-scm-btn-save:hover { opacity:.85; }
    .adm-scm-btn-del { width:28px; height:28px; border:none; background:var(--adm-red-bg,#fff0f0); cursor:pointer; color:var(--adm-red,#cc4444); font-size:13px; border-radius:7px; padding:0; flex-shrink:0; transition:background .15s; }
    .adm-scm-btn-del:hover { background:#fbd0d6; }
    .adm-scm-btn-del:disabled { opacity:.35; cursor:not-allowed; background:var(--adm-border,#e8eaed); color:var(--adm-muted,#999); }
    .adm-scm-count { font-size:11px; color:var(--adm-muted,#aaa); background:var(--adm-light,#f4f6f8); border-radius:20px; padding:1px 7px; margin-left:4px; flex-shrink:0; white-space:nowrap; }
    .adm-scm-footer-add { padding:12px 14px 8px; border-top:1px solid var(--adm-border,#f0ede8); display:flex; gap:8px; }
    .adm-scm-new-inp { flex:1; border:1.5px solid var(--adm-border,#e0ddd8); border-radius:9px; padding:9px 12px; font-size:13px; font-family:inherit; outline:none; background:var(--adm-input,#fafaf9); color:var(--adm-text,#1a1a1a); transition:border-color .15s,box-shadow .15s; }
    .adm-scm-new-inp:focus { border-color:var(--adm-navy,#417033); box-shadow:0 0 0 3px rgba(65,112,51,.12); background:var(--adm-card,#fff); }
    .adm-scm-add-btn { background:var(--adm-navy,#417033); color:#fff; border:none; border-radius:9px; padding:9px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; transition:opacity .15s,transform .12s; }
    .adm-scm-add-btn:hover { opacity:.88; transform:translateY(-1px); }
    .adm-scm-footer-actions { padding:8px 14px 16px; display:flex; justify-content:space-between; align-items:center; }
    .adm-scm-reset-btn { font-size:11px; color:var(--adm-muted,#aaa); background:none; border:none; cursor:pointer; text-decoration:underline; text-underline-offset:2px; padding:0; font-family:inherit; transition:color .15s; }
    .adm-scm-reset-btn:hover { color:var(--adm-red,#cc4444); }
    .adm-scm-done-btn { background:var(--adm-light,#E7F2E3); color:var(--adm-navy,#417033); border:1.5px solid var(--adm-border,#cde3c5); border-radius:9px; padding:9px 22px; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; transition:background .15s; }
    .adm-scm-done-btn:hover { background:var(--adm-soft,#B6D8AB); }

    /* ── PRESETS ── */
    .adm-preset-fmttabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .adm-preset-fmt { background: var(--adm-card); border: 1.5px solid var(--adm-border); border-radius: 20px; padding: 7px 18px; font-size: 13px; font-weight: 700; cursor: pointer; color: var(--adm-muted); font-family: inherit; transition: all .15s; }
    .adm-preset-fmt:hover { border-color: var(--adm-navy); color: var(--adm-navy); }
    .adm-preset-fmt.active { background: var(--adm-navy); border-color: var(--adm-navy); color: #fff; }
    .adm-preset-panel { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: stretch; }
    @media (max-width: 700px) { .adm-preset-panel { grid-template-columns: 1fr; } }
    .adm-preset-col { background: var(--adm-card); border: 1px solid var(--adm-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .adm-preset-col-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--adm-light); border-bottom: 1px solid var(--adm-border); gap: 8px; }
    body.dark .adm-preset-col-head { background: #2a2a2a; }
    .adm-preset-col-title { font-size: 13px; font-weight: 800; color: var(--adm-navy); }
    .adm-preset-col-cnt { font-size: 11px; color: var(--adm-muted); font-weight: 600; white-space: nowrap; }
    .adm-preset-list { flex: 1; overflow-y: auto; min-height: 200px; max-height: 600px; }
    .adm-preset-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--adm-border); transition: background .1s; }
    body.dark .adm-preset-row { border-bottom-color: #3c3c3c; }
    .adm-preset-row:hover { background: var(--adm-row-hover); }
    .adm-preset-row:last-child { border-bottom: none; }
    .adm-preset-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
    .adm-preset-thumb-empty { width: 36px; height: 36px; border-radius: 6px; background: var(--adm-bg); border: 1px dashed var(--adm-border); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .adm-preset-name { flex: 1; font-size: 12px; font-weight: 600; color: var(--adm-text); line-height: 1.3; min-width: 0; }
    .adm-preset-qty { width: 52px; padding: 4px 6px; border: 1.5px solid var(--adm-border); border-radius: 7px; font-size: 13px; font-weight: 700; text-align: center; background: var(--adm-input); color: var(--adm-text); font-family: inherit; outline: none; flex-shrink: 0; }
    .adm-preset-qty:focus { border-color: var(--adm-navy); }
    .adm-preset-remove { width: 26px; height: 26px; border: none; background: none; color: var(--adm-muted); font-size: 15px; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; flex-shrink: 0; }
    .adm-preset-remove:hover { background: var(--adm-red-bg); color: var(--adm-red); }
    #adm-preset-save-btn { background: var(--adm-navy); color: #fff; border: none; border-radius: 9px; padding: 8px 20px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s; white-space: nowrap; box-shadow: 0 2px 8px rgba(65,112,51,.25); }
    #adm-preset-save-btn:hover { opacity: .88; transform: translateY(-1px); }
    #adm-preset-save-btn:active { transform: translateY(0); }
    #adm-preset-save-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
    .adm-preset-empty { padding: 32px; text-align: center; color: var(--adm-muted); font-size: 13px; }
    #adm-preset-search { display: block; width: calc(100% - 32px); margin: 12px 16px 8px; border: 1.5px solid var(--adm-border); border-radius: 9px; padding: 8px 12px; font-size: 13px; outline: none; background: var(--adm-card); color: var(--adm-text); font-family: inherit; box-sizing: border-box; transition: border-color .15s; }
    #adm-preset-search:focus { border-color: var(--adm-navy); box-shadow: 0 0 0 3px rgba(65,112,51,.1); }
    .adm-preset-hide-added { display: inline-flex; align-items: center; gap: 7px; margin: 0 16px 10px; color: var(--adm-muted); font-size: 12px; font-weight: 700; cursor: pointer; user-select: none; }
    .adm-preset-hide-added input { width: 15px; height: 15px; accent-color: var(--adm-navy); cursor: pointer; }
    #adm-preset-subcat-tabs { display: flex; gap: 5px; flex-wrap: wrap; padding: 0 16px 10px; border-bottom: 1px solid var(--adm-border); }
    .adm-preset-lib-scroll { flex: 1 1 auto; overflow-y: auto; min-height: 220px; max-height: 600px; }
    .adm-preset-lib-group { padding: 6px 12px 4px; font-size: 10px; font-weight: 700; color: var(--adm-muted); text-transform: uppercase; letter-spacing: .06em; background: var(--adm-light); border-top: 1px solid var(--adm-border); position: static; }
    body.dark .adm-preset-lib-group { background: #2a2a2a; border-top-color: #3c3c3c; }
    .adm-preset-lib-cat-head { padding: 10px 12px 5px; font-size: 12px; font-weight: 800; color: var(--adm-navy); background: var(--adm-card); border-top: 2px solid var(--adm-navy); margin-top: 4px; position: static; }
    body.dark .adm-preset-lib-cat-head { background: #232323; }
    .adm-preset-lib-item { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid var(--adm-light); transition: background .1s; }
    body.dark .adm-preset-lib-item { border-bottom-color: #3c3c3c; }
    .adm-preset-lib-item:hover { background: var(--adm-row-hover); }
    .adm-preset-thumb-sm { width: 28px; height: 28px; object-fit: cover; border-radius: 5px; flex-shrink: 0; }
    .adm-preset-lib-name { flex: 1; font-size: 12px; font-weight: 600; color: var(--adm-text); min-width: 0; }
    .adm-preset-lib-price { font-size: 11px; color: var(--adm-muted); font-weight: 400; }
    .adm-preset-add-btn { flex-shrink: 0; width: 26px; height: 26px; border: 1.5px solid var(--adm-navy); border-radius: 7px; background: none; color: var(--adm-navy); font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; line-height: 1; }
    .adm-preset-add-btn:hover:not(:disabled) { background: var(--adm-navy); color: #fff; }
    .adm-preset-add-btn:disabled { border-color: var(--adm-soft); color: var(--adm-soft); cursor: default; font-size: 12px; }
    .adm-preset-in-badge { flex-shrink: 0; border: 1.5px solid var(--adm-border); border-radius: 999px; background: var(--adm-light); color: var(--adm-muted); font-size: 11px; font-weight: 800; line-height: 1; padding: 6px 9px; white-space: nowrap; }
    .adm-preset-total { font-size: 15px; color: var(--adm-navy); font-weight: 800; white-space: nowrap; letter-spacing: -.01em; }
    .adm-preset-row-price { font-size: 10px; color: var(--adm-muted); font-weight: 400; margin-top: 2px; }
    .adm-preset-cat-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 8px; background: var(--adm-light); color: var(--adm-navy); border: 1px solid var(--adm-border); margin-left: 5px; vertical-align: middle; text-transform: uppercase; letter-spacing: .04em; }
    #adm-preset-save-btn.dirty { background: #e07b00; box-shadow: 0 2px 12px rgba(224,123,0,.4); animation: adm-pulse .8s ease-in-out infinite alternate; }
    @keyframes adm-pulse { from { opacity: 1; transform: translateY(0); } to { opacity: .82; transform: translateY(-1px); } }
    .adm-preset-fmt-cnt { font-size: 10px; opacity: .75; font-weight: 600; }
    .adm-preset-clear-btn { background: none; border: 1.5px solid var(--adm-border); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; color: var(--adm-muted); cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; }
    .adm-preset-clear-btn:hover { border-color: var(--adm-red); color: var(--adm-red); background: var(--adm-red-bg); }
    .adm-preset-copy-row { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 12px; border-top: 2px solid var(--adm-border); background: var(--adm-bg); align-items: center; margin-top: auto; }
    body.dark .adm-preset-copy-row { background: #1e1e1e; border-top-color: #3c3c3c; }
    .adm-preset-copy-lbl { font-size: 11px; font-weight: 700; color: var(--adm-text); align-self: center; white-space: nowrap; }
    .adm-preset-copy-btn { background: var(--adm-card); border: 1.5px solid var(--adm-border); border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 700; color: var(--adm-text); cursor: pointer; font-family: inherit; transition: all .15s; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    .adm-preset-copy-btn:hover { border-color: var(--adm-navy); color: var(--adm-navy); background: var(--adm-light); transform: translateY(-1px); }
    .adm-preset-row[draggable] { cursor: grab; }
    .adm-preset-row[draggable]:active { cursor: grabbing; }
    .adm-preset-row.drag-over { background: rgba(65,112,51,.08); outline: 2px dashed var(--adm-navy); outline-offset: -2px; }
    .adm-preset-drag-handle { color: var(--adm-soft); font-size: 14px; cursor: grab; flex-shrink: 0; user-select: none; padding: 0 2px; }
    .adm-preset-name-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .adm-preset-current-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 12px 5px; background: var(--adm-light); border-top: 1px solid var(--adm-border); border-bottom: 1px solid var(--adm-border); color: var(--adm-navy); font-size: 11px; font-weight: 800; }
    .adm-preset-current-cat-head:first-child { border-top: none; }
    .adm-preset-current-cat-head span:last-child { color: var(--adm-muted); font-weight: 700; white-space: nowrap; }

    /* ── AUTHORS ── */
    .adm-authors-grid { display:grid; grid-template-columns:360px 1fr; gap:16px; align-items:start; }
    @media (max-width: 800px) { .adm-authors-grid { grid-template-columns:1fr; } }
    .adm-authors-card { background:var(--adm-card); border:1px solid var(--adm-border); border-radius:12px; overflow:hidden; }
    .adm-authors-card-title { padding:12px 14px; background:var(--adm-light); border-bottom:1px solid var(--adm-border); color:var(--adm-navy); font-size:13px; font-weight:900; }
    .adm-author-filters { display:grid; grid-template-columns:150px minmax(0,1fr); gap:8px; padding:10px 12px; border-bottom:1px solid var(--adm-border); background:var(--adm-card); }
    .adm-author-filters select,.adm-author-filters input { width:100%; border:1.5px solid var(--adm-border); border-radius:9px; padding:8px 10px; background:var(--adm-input); color:var(--adm-text); font:700 12px inherit; outline:none; }
    .adm-authors-list,.adm-author-recipes-list { padding:6px 12px; }
    .adm-author-row,.adm-author-recipe-row { display:flex; justify-content:space-between; gap:12px; padding:11px 0; border-bottom:1px solid var(--adm-border); }
    .adm-author-row.has-task { margin:0 -6px; padding:11px 6px; border-radius:10px; background:rgba(65,112,51,.05); border-bottom-color:transparent; }
    .adm-author-row:last-child,.adm-author-recipe-row:last-child { border-bottom:none; }
    .adm-author-row b,.adm-author-recipe-row b { display:block; color:var(--adm-text); font-size:13px; }
    .adm-author-row span,.adm-author-recipe-row span { display:block; color:var(--adm-muted); font-size:11px; margin-top:2px; }
    .adm-author-contact-link { display:block; color:var(--adm-muted); font-size:11px; margin-top:2px; text-decoration:none; }
    .adm-author-contact-link:hover { color:var(--adm-navy); text-decoration:underline; }
    .adm-bitrix-sync { display:inline-flex !important; width:max-content; border-radius:999px; padding:2px 8px; font-size:10px !important; font-weight:900; margin-top:6px !important; }
    .adm-bitrix-sync.ok { background:var(--adm-light); color:var(--adm-navy) !important; }
    .adm-bitrix-sync.pending { background:#fff7d6; color:#8a5a00 !important; }
    .adm-bitrix-sync.error { background:var(--adm-red-bg); color:var(--adm-red) !important; }
    .adm-bitrix-sync.muted { background:var(--adm-bg); color:var(--adm-muted) !important; }
    body.dark .adm-bitrix-sync.pending { background:#3a2f12; color:#e2b84f !important; }
    .adm-author-task-badges { display:flex; flex-wrap:wrap; gap:4px; margin-top:7px; }
    .adm-author-task-badge { display:inline-flex !important; width:auto; border-radius:999px; padding:2px 7px; margin:0 !important; font-size:10px !important; font-weight:900; }
    .adm-author-task-badge.submitted { background:var(--adm-light); color:var(--adm-navy) !important; }
    .adm-author-task-badge.rejected,.adm-author-task-badge.warn { background:#fff7d6; color:#8a5a00 !important; }
    .adm-author-task-badge.muted { background:var(--adm-bg); color:var(--adm-muted) !important; }
    body.dark .adm-author-row.has-task { background:rgba(137,209,133,.08); }
    body.dark .adm-author-task-badge.rejected, body.dark .adm-author-task-badge.warn { background:#3a2f12; color:#e2b84f !important; }
    .adm-bitrix-error { display:block; max-width:220px; color:var(--adm-red); font-size:10px; font-style:normal; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .adm-author-sync-btn { margin-top:7px; border:1.5px solid var(--adm-border); border-radius:8px; background:var(--adm-card); color:var(--adm-navy); padding:6px 9px; font-size:11px; font-weight:900; cursor:pointer; font-family:inherit; }
    .adm-author-sync-btn:hover { background:var(--adm-light); border-color:var(--adm-navy); }
    .adm-author-meta { display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0; }
    .adm-author-queue { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; padding:6px 0 12px; border-bottom:1px solid var(--adm-border); margin-bottom:4px; }
    .adm-author-queue-card { border:1px solid var(--adm-border); border-radius:10px; background:var(--adm-bg); padding:10px; min-width:0; }
    .adm-author-queue-card strong { display:block; color:var(--adm-text); font-size:20px; line-height:1; }
    .adm-author-queue-card span { display:block; color:var(--adm-muted); font-size:10px; font-weight:900; margin-top:5px; text-transform:uppercase; letter-spacing:.04em; }
    .adm-author-queue-card.is-submitted { background:var(--adm-light); }
    .adm-author-queue-card.is-submitted strong,.adm-author-queue-card.is-published strong { color:var(--adm-navy); }
    .adm-author-queue-card.is-rejected,.adm-author-queue-card.is-repeat { background:#fff7d6; }
    .adm-author-queue-card.is-rejected strong,.adm-author-queue-card.is-repeat strong { color:#8a5a00; }
    body.dark .adm-author-queue-card.is-rejected, body.dark .adm-author-queue-card.is-repeat { background:#3a2f12; }
    body.dark .adm-author-queue-card.is-rejected strong, body.dark .adm-author-queue-card.is-repeat strong { color:#e2b84f; }
    .adm-author-recipe-main { min-width:0; flex:1; }
    .adm-author-recipe-main em { display:block; color:#b45309; font-size:11px; font-style:normal; margin-top:4px; }
    .adm-author-recipe-meta { color:var(--adm-muted) !important; }
    .adm-author-recipe-note { display:inline-flex !important; width:max-content; max-width:100%; border-radius:999px; padding:3px 8px; margin-top:6px !important; font-size:10px !important; font-weight:900; background:var(--adm-light); color:var(--adm-navy) !important; }
    .adm-author-recipe-note.status-rejected { background:#fff7d6; color:#8a5a00 !important; }
    .adm-author-recipe-note.status-archived { background:#f1f1f1; color:#777 !important; }
    body.dark .adm-author-recipe-note.status-rejected { background:#3a2f12; color:#e2b84f !important; }
    .adm-author-recipe-actions { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end; max-width:420px; }
    .adm-author-recipe-actions button { border:1.5px solid var(--adm-border); border-radius:8px; background:var(--adm-card); color:var(--adm-text); padding:7px 9px; font-size:11px; font-weight:800; cursor:pointer; font-family:inherit; }
    .adm-author-recipe-actions button:hover { border-color:var(--adm-navy); color:var(--adm-navy); background:var(--adm-light); }
    .adm-author-price { width:86px; border:1.5px solid var(--adm-border); border-radius:8px; padding:7px 8px; background:var(--adm-input); color:var(--adm-text); font:700 12px inherit; }
    .adm-author-status-pill { display:inline-flex; border-radius:999px; padding:5px 9px; font-size:11px; font-weight:900; background:var(--adm-light); color:var(--adm-navy); border:1px solid var(--adm-border); }
    .adm-author-status-pill.status-rejected { background:#fff7d6; color:#8a5a00; }
    .adm-author-status-pill.status-published { background:#e7f2e3; color:#417033; }
    .adm-author-status-pill.status-archived { background:#f1f1f1; color:#777; }
    .adm-author-review-flags-inline { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    .adm-author-review-flags-inline span { display:inline-flex; width:auto; border-radius:999px; padding:2px 7px; background:#fff7d6; color:#8a5a00 !important; font-size:10px !important; font-weight:900; }
    .adm-author-empty { color:var(--adm-muted); font-size:13px; padding:18px 4px; text-align:center; }
    #adm-author-review-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.44); opacity:0; pointer-events:none; transition:.18s; z-index:10010; }
    #adm-author-review-backdrop.show { opacity:1; pointer-events:auto; }
    #adm-author-review-drawer {
      --adm-navy:#417033;
      --adm-green:#4F883E;
      --adm-light:#E7F2E3;
      --adm-border:#cde3c5;
      --adm-red:#CC2841;
      --adm-bg:#f5f5f5;
      --adm-card:#ffffff;
      --adm-text:#1a1a1a;
      --adm-muted:#6b7280;
      --adm-input:#fafaf9;
      position:fixed; top:0; right:0; width:min(820px,96vw); height:100vh;
      background:var(--adm-card) !important; box-shadow:-12px 0 40px rgba(0,0,0,.28);
      transform:translateX(105%); transition:.22s; z-index:10020;
      display:flex; flex-direction:column; color:var(--adm-text) !important;
      font-family:'Mulish', -apple-system, BlinkMacSystemFont, sans-serif !important;
      opacity:1 !important;
    }
    body.dark #adm-author-review-drawer {
      --adm-navy:#91dc8b;
      --adm-green:#6fc66c;
      --adm-light:#2b3229;
      --adm-border:#3f453f;
      --adm-red:#f08b9a;
      --adm-bg:#191919;
      --adm-card:#242424;
      --adm-text:#e8e8e8;
      --adm-muted:#a4a7ad;
      --adm-input:#333333;
    }
    #adm-author-review-drawer * { box-sizing:border-box; font-family:'Mulish', -apple-system, BlinkMacSystemFont, sans-serif !important; }
    #adm-author-review-drawer.open { transform:translateX(0); }
    #adm-author-review-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:16px 18px; border-bottom:1px solid var(--adm-border); background:var(--adm-light) !important; color:var(--adm-text) !important; }
    #adm-author-review-title { margin:0; font-size:18px; font-weight:900; color:var(--adm-navy); }
    #adm-author-review-sub { display:block; margin-top:3px; font-size:12px; color:var(--adm-muted); }
    #adm-author-review-close { border:none; background:transparent; color:var(--adm-muted); font-size:20px; cursor:pointer; }
    #adm-author-review-body { flex:1; overflow:auto; padding:16px 18px; display:grid; gap:12px; background:var(--adm-card) !important; color:var(--adm-text) !important; }
    #adm-author-review-footer { position:static; padding:12px 18px; background:var(--adm-card) !important; border-top:1px solid var(--adm-border); display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
    #adm-author-review-footer button { border:1.5px solid var(--adm-border); border-radius:9px; background:var(--adm-card); color:var(--adm-text); padding:9px 12px; font-size:12px; font-weight:900; cursor:pointer; font-family:inherit; }
    #adm-author-review-footer button[data-status="published"] { background:var(--adm-navy); border-color:var(--adm-navy); color:#fff; }
    #adm-author-review-footer button[data-status="rejected"] { background:#fff7d6; border-color:#e2b84f; color:#8a5a00; }
    #adm-author-review-footer button[data-status="archived"] { color:var(--adm-red); border-color:#f4b8c4; }
    .adm-review-hero { display:grid; grid-template-columns:220px minmax(0,1fr); gap:14px; align-items:start; }
    .adm-review-photo { aspect-ratio:4/3; border-radius:12px; overflow:hidden; background:var(--adm-light); border:1px solid var(--adm-border); display:grid; place-items:center; color:var(--adm-muted); font-size:12px; font-weight:800; }
    .adm-review-photo img { width:100%; height:100%; object-fit:cover; display:block; }
    .adm-review-summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .adm-review-summary div,.adm-review-block { border:1px solid var(--adm-border); border-radius:10px; background:var(--adm-bg) !important; padding:10px; color:var(--adm-text) !important; }
    .adm-review-summary b { display:block; color:var(--adm-muted); font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
    .adm-review-summary span { display:block; margin-top:3px; color:var(--adm-text); font-size:13px; font-weight:800; }
    .adm-review-form-grid { display:grid; grid-template-columns:180px minmax(0,1fr); gap:10px; }
    .adm-review-form-grid label { display:grid; gap:5px; color:var(--adm-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
    .adm-review-form-grid input,.adm-review-form-grid textarea,#adm-review-comment { width:100%; box-sizing:border-box; border:1.5px solid var(--adm-border); border-radius:9px; padding:9px 10px; background:var(--adm-input); color:var(--adm-text); font:700 13px inherit; outline:none; text-transform:none; letter-spacing:0; }
    .adm-review-block h4,.adm-review-feedback h4 { margin:0 0 8px; color:var(--adm-navy); font-size:13px; }
    .adm-review-block p { margin:0 0 6px; color:var(--adm-text); font-size:13px; line-height:1.55; white-space:pre-wrap; }
    .adm-review-muted { color:var(--adm-muted) !important; }
    .adm-review-list,.adm-review-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .adm-review-list span,.adm-review-tags span { display:inline-flex; border-radius:999px; padding:6px 9px; background:var(--adm-card); border:1px solid var(--adm-border); color:var(--adm-text); font-size:12px; font-weight:800; }
    .adm-review-tags span { background:var(--adm-light); color:var(--adm-navy); }
    .adm-review-two { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .adm-review-feedback { border:1px solid var(--adm-border); border-radius:12px; background:var(--adm-light) !important; padding:12px; display:grid; gap:9px; color:var(--adm-text) !important; }
    .adm-review-checklist { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
    .adm-review-checklist label { display:flex; align-items:center; gap:7px; border:1px solid var(--adm-border); border-radius:8px; background:var(--adm-card); padding:8px; color:var(--adm-text); font-size:12px; font-weight:800; }
    .adm-review-history { display:grid; gap:7px; }
    .adm-review-history-item { border:1px solid var(--adm-border); border-radius:9px; background:var(--adm-card); padding:8px 10px; color:var(--adm-text); }
    .adm-review-history-item b { display:block; color:var(--adm-navy); font-size:12px; margin-bottom:2px; }
    .adm-review-history-item span { display:block; color:var(--adm-muted); font-size:11px; }
    .adm-review-history-item p { margin:5px 0 0; color:var(--adm-text); font-size:12px; line-height:1.45; white-space:pre-wrap; }
    #adm-review-error { color:var(--adm-red); font-size:12px; font-weight:800; min-height:16px; }
    body.dark .adm-authors-card {
      background:#242424;
      border-color:#3f453f;
      box-shadow:0 8px 26px rgba(0,0,0,.18);
    }
    body.dark .adm-authors-card-title {
      background:#273026;
      border-bottom-color:#3f453f;
      color:#91dc8b;
    }
    body.dark .adm-author-filters {
      background:#242424;
      border-bottom-color:#3f453f;
    }
    body.dark .adm-author-filters select,
    body.dark .adm-author-filters input {
      background:#333333;
      border-color:#464b46;
      color:#e8e8e8;
    }
    body.dark .adm-author-row,
    body.dark .adm-author-recipe-row {
      border-bottom-color:#3a3a3a;
    }
    body.dark .adm-author-row.has-task {
      background:#283027;
      border-color:#3e5639;
    }
    body.dark .adm-bitrix-sync.ok,
    body.dark .adm-author-task-badge.submitted {
      background:#233823;
      color:#91dc8b !important;
    }
    body.dark .adm-bitrix-sync.muted,
    body.dark .adm-author-task-badge.muted {
      background:#303030;
      color:#b0b0b0 !important;
    }
    body.dark .adm-author-task-badge.rejected,
    body.dark .adm-author-task-badge.warn,
    body.dark .adm-author-recipe-note.status-rejected,
    body.dark .adm-author-review-flags-inline span {
      background:#3a311d !important;
      color:#e8c15f !important;
      border-color:#5a4a25;
    }
    body.dark .adm-author-recipe-note.status-archived,
    body.dark .adm-author-status-pill.status-archived {
      background:#303030;
      color:#bebebe !important;
      border-color:#4a4a4a;
    }
    body.dark .adm-author-status-pill.status-rejected {
      background:#3a311d;
      color:#e8c15f;
      border-color:#5a4a25;
    }
    body.dark .adm-author-status-pill.status-published {
      background:#233823;
      color:#91dc8b;
      border-color:#3e5639;
    }
    body.dark .adm-author-recipe-actions button,
    body.dark .adm-author-sync-btn {
      background:#2b2b2b;
      border-color:#4a4a4a;
      color:#e8e8e8;
    }
    body.dark .adm-author-recipe-actions button:hover,
    body.dark .adm-author-sync-btn:hover {
      background:#30382e;
      border-color:#5f8558;
      color:#91dc8b;
    }
    body.dark #adm-author-review-head {
      background:#273026 !important;
      border-bottom-color:#3f453f;
    }
    body.dark #adm-author-review-footer button {
      background:#2b2b2b;
      border-color:#4a4a4a;
      color:#e8e8e8;
    }
    body.dark #adm-author-review-footer button[data-status="published"] {
      background:#4f883e;
      border-color:#4f883e;
      color:#fff;
    }
    body.dark #adm-author-review-footer button[data-status="rejected"] {
      background:#3a311d;
      border-color:#b98a25;
      color:#f0cb6a;
    }
    body.dark #adm-author-review-footer button[data-status="archived"] {
      background:#2b2024;
      border-color:#6f3d49;
      color:#f08b9a;
    }
    body.dark .adm-review-summary div,
    body.dark .adm-review-block {
      background:#202020 !important;
      border-color:#3f453f;
    }
    body.dark .adm-review-feedback {
      background:#262d25 !important;
      border-color:#3f453f;
    }
    body.dark .adm-review-list span,
    body.dark .adm-review-tags span,
    body.dark .adm-review-checklist label,
    body.dark .adm-review-history-item {
      background:#2b2b2b;
      border-color:#464b46;
      color:#e8e8e8;
    }
    @media (max-width: 700px) {
      .adm-author-filters { grid-template-columns:1fr; }
      .adm-review-hero,.adm-review-form-grid,.adm-review-two { grid-template-columns:1fr; }
      .adm-review-summary,.adm-review-checklist { grid-template-columns:1fr; }
    }
    @media (max-width: 760px) {
      html, body { max-width:100%; overflow-x:hidden; }
      #adm-root {
        box-sizing:border-box;
        width:100vw;
        max-width:100vw;
        margin-left:calc(50% - 50vw);
        margin-right:calc(50% - 50vw);
        padding:14px 12px calc(128px + env(safe-area-inset-bottom, 0px));
        overflow-x:hidden;
      }
      #adm-root, #adm-root * { min-width:0; }
      #adm-panel {
        width:100%;
        max-width:100%;
        min-width:0;
        overflow:hidden;
      }
      #adm-users-section,
      #adm-equipment-section,
      #adm-suppliers-section,
      #adm-presets-section,
      #adm-authors-section {
        width:100%;
        max-width:100%;
        overflow:hidden;
      }
      .adm-topbar {
        height:auto;
        min-height:0;
        align-items:flex-start;
        gap:10px;
        padding:14px;
        border-radius:14px;
        margin-bottom:14px;
        flex-wrap:wrap;
      }
      .adm-topbar-brand { flex:1 1 100%; min-width:0; }
      #adm-logo-img { height:34px; max-width:min(240px, 80vw); object-fit:contain; }
      .adm-topbar-right {
        width:100%;
        display:grid;
        grid-template-columns:minmax(0,1fr) 48px 76px;
        gap:8px;
        align-items:center;
      }
      #adm-me {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-size:13px;
      }
      #adm-theme-btn, #adm-logout {
        min-height:40px;
        border-radius:11px;
        padding:7px 10px;
        font-size:13px;
      }

      .adm-tabs {
        gap:4px;
        width:calc(100% + 24px);
        max-width:calc(100% + 24px);
        overflow-x:auto;
        overflow-y:hidden;
        -webkit-overflow-scrolling:touch;
        touch-action:pan-x;
        overscroll-behavior-x:contain;
        overscroll-behavior-y:none;
        scroll-snap-type:x proximity;
        margin:0 -12px 14px;
        padding:0 12px;
        border-bottom:2px solid var(--adm-border);
      }
      .adm-tabs::-webkit-scrollbar { display:none; }
      .adm-tab {
        flex:0 0 auto;
        min-width:auto;
        padding:8px 12px 10px;
        text-align:center;
        scroll-snap-align:start;
        font-size:12px;
        line-height:1.15;
      }

      .adm-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:14px; }
      .adm-stat { min-height:74px; border-radius:13px; padding:12px 14px; }
      .adm-stat-val { font-size:26px; }
      .adm-stat-lbl { font-size:11px; line-height:1.25; }

      .adm-toolbar, .adm-eq-toolbar {
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px;
        align-items:stretch;
        margin-bottom:12px;
      }
      #adm-authors-section .adm-eq-toolbar { grid-template-columns:minmax(0,1fr); }
      #adm-authors-section .adm-eq-toolbar > div { min-width:0; }
      #adm-authors-section .adm-eq-toolbar > div > div:first-child {
        font-size:20px !important;
        line-height:1.15;
      }
      #adm-authors-refresh {
        justify-self:start;
        width:auto;
        max-width:100%;
      }
      .adm-toolbar .adm-search, .adm-eq-toolbar .adm-search, #adm-eq-search, #adm-sup-search {
        grid-column:1 / -1;
        min-width:0;
        width:100%;
        min-height:44px;
        font-size:16px;
        border-radius:13px;
      }
      .adm-filter-btns {
        display:flex;
        grid-column:1 / -1;
        overflow-x:auto;
        flex-wrap:nowrap;
        padding-bottom:2px;
      }
      .adm-filter-btns::-webkit-scrollbar { display:none; }
      .adm-fb, #adm-csv-btn, #adm-refresh, #adm-authors-refresh, #adm-eq-add-btn, #adm-sup-add-btn {
        min-height:40px;
        border-radius:11px;
        white-space:nowrap;
      }
      #adm-csv-btn, #adm-refresh {
        padding:8px 12px;
        justify-content:center;
      }

      .adm-table-wrap {
        width:100%;
        max-width:100%;
        overflow-x:auto;
        -webkit-overflow-scrolling:touch;
        border-radius:16px;
      }
      #adm-table {
        display:block !important;
        min-width:0 !important;
        width:100%;
        border-spacing:0;
        font-size:13px;
      }
      #adm-table thead { display:none; }
      #adm-table tbody {
        display:grid;
        gap:10px;
        padding:0;
      }
      #adm-table tbody tr {
        display:grid;
        grid-template-columns:24px 42px minmax(0,1fr);
        gap:8px 12px;
        width:100%;
        padding:12px;
        border:1px solid var(--adm-border);
        border-radius:14px;
        background:var(--adm-card);
        box-shadow:0 1px 8px rgba(0,0,0,.05);
        cursor:pointer;
      }
      #adm-table tbody tr:hover td { background:transparent; }
      #adm-table tbody td {
        display:block;
        padding:0;
        border-bottom:none;
        background:transparent !important;
        min-width:0;
      }
      #adm-table tbody td:nth-child(1) { grid-column:1; grid-row:1 / span 4; padding-top:8px; color:var(--adm-muted); }
      #adm-table tbody td:nth-child(2) { grid-column:2 / 4; }
      #adm-table tbody td:nth-child(2) > div {
        display:grid !important;
        grid-template-columns:42px minmax(0,1fr);
        align-items:start !important;
        gap:10px !important;
        min-width:0;
      }
      #adm-table tbody td:nth-child(2) div[style*="font-weight:700"] {
        font-size:14px !important;
        line-height:1.25;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      #adm-table tbody td:nth-child(3),
      #adm-table tbody td:nth-child(4),
      #adm-table tbody td:nth-child(5) { grid-column:3; }
      .adm-access-badges { gap:5px; }
      .adm-row-actions { justify-content:flex-start; }
      .adm-icon-btn {
        width:38px;
        height:38px;
        border:1px solid var(--adm-border);
        background:var(--adm-bg);
      }
      #adm-pagination {
        background:transparent;
        border-top:none;
        padding:12px 0;
      }
      #adm-pag-info { flex-basis:100%; margin-left:0; }

      #adm-drawer, #adm-eq-drawer, #adm-sup-drawer {
        top:auto;
        right:0;
        bottom:0;
        left:0;
        width:100vw;
        max-width:100vw;
        height:min(92dvh, 760px);
        border-radius:22px 22px 0 0;
        transform:translateY(105%);
        box-shadow:0 -14px 44px rgba(0,0,0,.24);
      }
      #adm-drawer.open, #adm-eq-drawer.open, #adm-sup-drawer.open { transform:translateY(0); }
      #adm-drawer-head, #adm-eq-drawer-head, #adm-sup-drawer #adm-eq-drawer-head {
        padding:16px 18px;
        border-radius:22px 22px 0 0;
      }
      #adm-drawer-body, #adm-eq-drawer-body, #adm-sup-drawer #adm-eq-drawer-body { padding:16px; }
      #adm-drawer-footer, #adm-eq-drawer-footer, #adm-sup-drawer #adm-eq-drawer-footer {
        padding:12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
      }
      #adm-eq-drawer-footer, #adm-sup-drawer #adm-eq-drawer-footer {
        display:grid;
        grid-template-columns:1fr 1fr;
      }

      .adm-authors-grid {
        display:flex;
        flex-direction:column;
        gap:12px;
        width:100%;
        max-width:100%;
      }
      .adm-authors-grid .adm-authors-card:first-child { order:2; }
      .adm-authors-grid .adm-authors-card:nth-child(2) { order:1; }
      .adm-authors-card {
        width:100%;
        max-width:100%;
        border-radius:16px;
      }
      .adm-authors-card-title {
        padding:14px 16px;
        font-size:15px;
      }
      .adm-author-filters {
        padding:12px;
        border-bottom:1px solid var(--adm-border);
      }
      .adm-author-filters select,
      .adm-author-filters input {
        min-height:44px;
        border-radius:12px;
        font-size:15px;
        font-weight:600;
      }
      .adm-authors-list, .adm-author-recipes-list { padding:12px; }
      .adm-author-row, .adm-author-recipe-row {
        display:grid;
        grid-template-columns:1fr;
        gap:12px;
        width:100%;
        max-width:100%;
        padding:14px;
        border:1px solid var(--adm-border);
        border-radius:14px;
        background:var(--adm-card);
        box-shadow:0 1px 8px rgba(0,0,0,.04);
      }
      .adm-author-row + .adm-author-row,
      .adm-author-recipe-row + .adm-author-recipe-row { margin-top:10px; }
      .adm-author-row.has-task {
        margin:10px 0 0;
        padding:14px;
        background:#fffdf2;
        border-color:#eadca5;
      }
      body.dark .adm-author-row.has-task {
        background:#2b2718;
        border-color:#504521;
      }
      .adm-author-meta {
        flex-direction:row;
        align-items:flex-start;
        justify-content:flex-start;
        flex-wrap:wrap;
        gap:6px;
      }
      .adm-author-row b, .adm-author-recipe-row b {
        font-size:17px;
        line-height:1.2;
      }
      .adm-author-row span, .adm-author-recipe-row span,
      .adm-author-contact-link {
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      .adm-author-row > div:first-child,
      .adm-author-recipe-main {
        display:grid;
        gap:6px;
      }
      .adm-author-row span,
      .adm-author-contact-link {
        margin-top:0;
        font-size:13px;
        line-height:1.35;
      }
      .adm-author-meta span {
        display:inline-flex;
        width:auto;
        border-radius:999px;
        padding:4px 8px;
        background:var(--adm-bg);
        color:var(--adm-muted);
        font-size:11px;
        font-weight:800;
      }
      .adm-bitrix-error { max-width:100%; white-space:normal; }
      .adm-bitrix-sync,
      .adm-author-task-badge {
        margin-top:0 !important;
        padding:4px 8px;
        font-size:11px !important;
      }
      .adm-author-task-badges { gap:6px; margin-top:2px; }
      .adm-author-sync-btn {
        width:100%;
        min-height:40px;
        margin-top:4px;
      }
      .adm-author-queue {
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
        padding:0 0 12px;
        margin-bottom:12px;
      }
      .adm-author-queue-card {
        padding:12px;
        background:var(--adm-card);
        border-radius:12px;
      }
      .adm-author-queue-card strong { font-size:22px; }
      .adm-author-queue-card span { font-size:10px; }
      .adm-author-recipe-meta {
        font-size:13px !important;
        line-height:1.35;
      }
      .adm-author-recipe-note {
        width:fit-content;
        max-width:100%;
        border-radius:10px;
        padding:7px 9px;
        font-size:12px !important;
        line-height:1.25;
      }
      .adm-author-recipe-main em {
        font-size:13px;
        line-height:1.35;
        margin-top:0;
      }
      .adm-author-review-flags-inline {
        gap:6px;
        margin-top:0;
      }
      .adm-author-review-flags-inline span {
        padding:4px 8px;
        font-size:11px !important;
        background:#f7efd3;
      }
      .adm-author-recipe-actions {
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        justify-content:stretch;
        max-width:none;
        gap:8px;
      }
      .adm-author-recipe-actions button {
        min-height:44px;
        border-radius:12px;
        font-size:13px;
        background:var(--adm-card);
      }
      .adm-author-status-pill {
        justify-content:center;
        min-height:44px;
        padding:10px;
        border-radius:12px;
        font-size:12px;
      }
      .adm-author-price { width:100%; max-width:150px; }

      #adm-author-review-drawer {
        top:0;
        right:0;
        bottom:0;
        left:0;
        width:100vw;
        max-width:100vw;
        height:100vh;
        height:100dvh;
        border-radius:0;
        transform:translateX(100%);
        box-shadow:none;
      }
      #adm-author-review-drawer.open { transform:translateX(0); }
      #adm-author-review-head {
        position:sticky;
        top:0;
        z-index:2;
        padding:18px 16px;
      }
      #adm-author-review-title { font-size:20px; line-height:1.12; }
      #adm-author-review-body {
        padding:14px;
        padding-bottom:16px;
        gap:12px;
      }
      #adm-author-review-footer {
        position:sticky;
        bottom:0;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        padding:10px 14px calc(12px + env(safe-area-inset-bottom, 0px));
        background:var(--adm-card) !important;
        border-top:1px solid var(--adm-border);
        box-shadow:0 -8px 24px rgba(0,0,0,.1);
        z-index:3;
      }
      #adm-author-review-footer button {
        min-height:48px;
        padding:10px 8px;
        white-space:normal;
        line-height:1.2;
      }
      #adm-author-review-footer button:first-child { grid-column:1 / -1; }
      .adm-review-photo { max-height:46vh; }
      .adm-review-summary div, .adm-review-block, .adm-review-feedback {
        border-radius:14px;
        padding:12px;
      }
    }
    @media (max-width: 390px) {
      #adm-root { padding-left:12px; padding-right:12px; }
      .adm-topbar { padding:12px; }
      #adm-logo-img { height:30px; max-width:210px; }
      .adm-topbar-right { grid-template-columns:minmax(0,1fr) 44px 72px; }
      .adm-stats { grid-template-columns:1fr 1fr; }
      .adm-tab { padding-left:10px; padding-right:10px; }
      #adm-table tbody tr { grid-template-columns:22px 38px minmax(0,1fr); }
      #adm-table tbody td:nth-child(2) > div { grid-template-columns:38px minmax(0,1fr); }
      #adm-author-review-footer { grid-template-columns:1fr; }
      #adm-author-review-footer button:first-child { grid-column:auto; }
    }
  `;
  document.head.appendChild(style);
