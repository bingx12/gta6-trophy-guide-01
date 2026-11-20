// Progress persistence: localStorage for the checklist, a JSON file for
// export/import, and a shareable ?earned= link that carries the same ids.
export const STORAGE_KEY = 'leonida-trophy-guide-v1';

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], spoilers: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { earned: [], spoilers: false };
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : [],
      spoilers: parsed.spoilers === true,
    };
  } catch {
    return { earned: [], spoilers: false };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoilers: state.spoilers === true,
    }));
  } catch {
    // Private browsing or a full store: the checklist still works in memory.
  }
}

// A link such as ?earned=2,3,4 lets a player share their progress. Only ids
// that exist in the trophy list are accepted, and the result is saved.
export function readSharedEarned(searchParams, validIds) {
  const raw = searchParams.get('earned');
  if (!raw) return [];
  return raw.split(',').map((s) => Number(s.trim())).filter((n) => validIds.has(n));
}

export function buildShareUrl(earnedIds) {
  const url = new URL(window.location.href);
  if (earnedIds.length === 0) url.searchParams.delete('earned');
  else url.searchParams.set('earned', [...earnedIds].sort((a, b) => a - b).join(','));
  return url.toString();
}

export function downloadProgressFile(state) {
  const payload = {
    app: 'leonida-trophy-guide',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoilers: state.spoilers === true,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Returns { earned, spoilers } on success, throws an Error with a plain
// message on a bad file so the caller can show it.
export async function parseImportedFile(file, validIds) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('That file has no earned-trophy list.');
  const earned = ids.map(Number).filter((n) => validIds.has(n));
  return { earned, spoilers: parsed.spoilers === true };
}
