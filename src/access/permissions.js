// src/access/permissions.js
// Единый frontend-слой прав для клиентского workspace.

export const WORKSPACE_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
};

export const ACCOUNT_ROLES = {
  OWNER: 'owner',
  PAID: 'paid',
  GUEST: 'guest',
};

export function canCreateOwnWorkspace(user = null, fallback = false) {
  if (user && typeof user.can_create_workspaces !== 'undefined') return !!user.can_create_workspaces;
  if (user?.is_admin) return true;
  const access = user?.access || {};
  return !!(fallback || access.drinks || access.finance || user?.access_drinks || user?.access_finance);
}

export function workspaceRole(workspace = null) {
  return workspace?.role || '';
}

export function hasWorkspaceMembership(workspace = null) {
  return !!(workspace && workspace.id);
}

export function canManageWorkspace(workspace = null) {
  return workspaceRole(workspace) === WORKSPACE_ROLES.OWNER;
}

export function canManageWorkspaceMembers(workspace = null) {
  return canManageWorkspace(workspace);
}

export function canManageWorkspaceStructure(workspace = null) {
  return canManageWorkspace(workspace);
}

export function canDeleteWorkspaceData(workspace = null) {
  return canManageWorkspace(workspace);
}

export function canRestoreWorkspace(workspace = null) {
  return canManageWorkspace(workspace);
}

export function canEditWorkspaceContent(workspace = null) {
  return hasWorkspaceMembership(workspace);
}

export function accountRole(user = null, workspace = null) {
  if (canManageWorkspace(workspace)) return ACCOUNT_ROLES.OWNER;
  return canCreateOwnWorkspace(user) ? ACCOUNT_ROLES.PAID : ACCOUNT_ROLES.GUEST;
}

export function workspaceRoleLabel(role = '') {
  return role === WORKSPACE_ROLES.OWNER ? 'владелец' : 'редактор';
}

export function accountRoleLabel(user = null, workspace = null) {
  const role = accountRole(user, workspace);
  if (role === ACCOUNT_ROLES.OWNER) return 'владелец проекта';
  if (role === ACCOUNT_ROLES.GUEST) return 'гость';
  return 'платный аккаунт';
}

export function requireWorkspacePermission(allowed, message = 'Это действие доступно только владельцу проекта.') {
  if (allowed) return true;
  window.showAlert?.(message, '🔒');
  return false;
}
