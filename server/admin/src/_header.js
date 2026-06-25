(function(){
  var API = 'https://barista-school.online/api';
  var _token = localStorage.getItem('adm_token') || '';
  var _users = [];
  var _filter = 'all';
  var _sort = { col: 'created_at', dir: -1 };
  var _page = 1;
  var _perPage = 20;
  // ── Equipment (oc-library) state ──────────────────────────────
  var _tab = 'users';
  var _oc_items = [];
  var _oc_selected = [];
  var _oc_edit_id = null;
  var _oc_main_tab = '';
  var _oc_sub_tab = '';
  // ── Suppliers state ──────────────────────────────────────────
  var _sup_items = [];
  var _sup_edit_id = null;
  // ── Presets state ─────────────────────────────────────────────
  var _preset_format = 'kiosk';
  var _preset_items = [];
  var _preset_lib_sub = '';
  var _preset_lib_cat = '';
  var _preset_hide_added = false;
  // ── Authors state ─────────────────────────────────────────────
  var _authors = [];
  var _author_recipes = [];
  var _author_review_id = null;
