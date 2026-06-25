import { isAuthorMode } from './author-layer.js';

const TAB_PATHS = {
  workspace: '/app/workspace',
  dashboard: '/app/budget',
  cost: '/app/suppliers',
  sales: '/app/sales',
  finmodel: '/app/finmodel',
  recipes: '/app/recipes',
  settings: '/app/settings',
};

const AUTHOR_TAB_PATHS = {
  cost: '/app/author/suppliers',
  recipes: '/app/author/recipes',
  authorProfile: '/app/author/profile',
};

const PATH_TABS = {
  '/app/workspace': 'workspace',
  '/app/zone': 'workspace',
  '/app/budget': 'dashboard',
  '/app/dashboard': 'dashboard',
  '/app/suppliers': 'cost',
  '/app/cost': 'cost',
  '/app/sales': 'sales',
  '/app/finmodel': 'finmodel',
  '/app/finance': 'finmodel',
  '/app/recipes': 'recipes',
  '/app/settings': 'settings',
  '/app/author/suppliers': 'cost',
  '/app/author/recipes': 'recipes',
  '/app/author/profile': 'authorProfile',
};

export function tabFromPath(pathname = location.pathname) {
  const normalized = String(pathname || '').replace(/\/+$/, '') || '/';
  return PATH_TABS[normalized] || null;
}

export function pathForTab(tab) {
  if (isAuthorMode() && AUTHOR_TAB_PATHS[tab]) return AUTHOR_TAB_PATHS[tab];
  return TAB_PATHS[tab] || '/';
}

export function syncUrlForTab(tab, { replace = false } = {}) {
  if (!tab || location.pathname === '/recipes' || location.pathname.startsWith('/recipes/')) return;
  const nextPath = pathForTab(tab);
  if (!nextPath || location.pathname === nextPath) return;
  const state = { tab };
  if (replace) history.replaceState(state, '', nextPath);
  else history.pushState(state, '', nextPath);
}
