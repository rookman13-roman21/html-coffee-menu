import { getUser } from '../ui/auth.js';

const AUTHOR_HIDDEN_SUPPLIERS = new Set(['hiwater', 'baristaline', 'майтаймкап']);

function normName(name) {
  return String(name || '').trim().toLowerCase();
}

export function isAuthorMode() {
  const user = getUser();
  if (!user || user.is_admin) return false;
  const access = user.access || {};
  const author = typeof access.author !== 'undefined' ? access.author : user.access_author;
  return !!author;
}

export function canAuthorSeeDrink(drink) {
  if (!isAuthorMode()) return true;
  return !!drink?.custom;
}

export function filterAuthorDrinks(drinks) {
  if (!isAuthorMode()) return drinks;
  return (drinks || []).filter(canAuthorSeeDrink);
}

export function canAuthorSeeSupplierName(name) {
  if (!isAuthorMode()) return true;
  return !AUTHOR_HIDDEN_SUPPLIERS.has(normName(name));
}

export function filterAuthorSupplierGroups(groups) {
  if (!isAuthorMode()) return groups;
  return (groups || []).filter(g => canAuthorSeeSupplierName(g?.name));
}

export function filterAuthorSupplierBook(book) {
  if (!isAuthorMode()) return book;
  return (book || []).filter(b => canAuthorSeeSupplierName(b?.name));
}

export function filterAuthorServerSuppliers(serverSups) {
  if (!isAuthorMode()) return serverSups;
  return (serverSups || []).filter(srv => canAuthorSeeSupplierName(srv?.name));
}
