// Leonida Trophy Guide: loads the trophy list and the roadmap, renders the
// checklist, and wires up filters, search, spoilers, progress and the guide
// panel. Everything runs offline from files under app/.
import { loadSavedState, saveState, readSharedEarned, buildShareUrl, downloadProgressFile, parseImportedFile } from './storage.js';
import { renderDetail, formatCount } from './guide.js';
import { renderRoadmap } from './roadmap.js';

const GRADE_LETTER = { Platinum: 'P', Gold: 'G', Silver: 'S', Bronze: 'B' };
const KIND_LABEL = { story: 'Story', missable: 'Missable', collectible: 'Collectible', activity: 'Activity', online: 'Online', platinum: 'Platinum' };

const listElement = document.getElementById('trophyList');
const detailElement = document.getElementById('detail');
const searchInput = document.getElementById('searchInput');
const gradeSelect = document.getElementById('gradeSelect');
const spoilerToggle = document.getElementById('spoilerToggle');
const listMeta = document.getElementById('listMeta');
const emptyState = document.getElementById('emptyState');
const ioStatus = document.getElementById('ioStatus');

const state = {
  trophies: [],
  roadmap: null,
  earned: new Set(),
  spoilers: false,
  kind: 'all',
  grade: 'all',
  search: '',
  view: 'checklist',
  selectedId: null,
};

function isSpoilerHidden(trophy) {
  return state.spoilers && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function trophyMatches(trophy) {
  if (state.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (state.kind === 'online') {
    return false; // No trophy in the list is online; the empty state says so.
  } else if (state.kind !== 'all' && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.search) {
    const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' + (trophy.mission || '') + ' ' + (trophy.chapter || '')).toLowerCase();
    if (!haystack.includes(state.search)) return false;
  }
  return true;
}

function renderProgress() {
  const total = state.trophies.length;
  const earnedCount = state.earned.size;
  document.getElementById('progressCount').textContent = earnedCount + ' of ' + total + ' earned';
  const percent = total === 0 ? 0 : Math.round((earnedCount / total) * 100);
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(earnedCount));
  const byGrade = {};
  for (const trophy of state.trophies) {
    if (!state.earned.has(trophy.id)) continue;
    byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  }
  const totals = {};
  for (const trophy of state.trophies) totals[trophy.grade] = (totals[trophy.grade] || 0) + 1;
  document.getElementById('gradeCounts').textContent =
    ['Platinum', 'Gold', 'Silver', 'Bronze']
      .map((g) => (byGrade[g] || 0) + '/' + (totals[g] || 0) + ' ' + g)
      .join(' · ') + ' — ' + percent + '% to the Platinum';
}

function renderChipCounts() {
  const counts = { all: state.trophies.length, story: 0, missable: 0, collectible: 0, activity: 0, online: 0 };
  for (const trophy of state.trophies) {
    if (counts[trophy.kind] !== undefined) counts[trophy.kind] += 1;
    if (trophy.missable) counts.missable += 1;
  }
  for (const span of document.querySelectorAll('.chip-count')) {
    span.textContent = '(' + (counts[span.dataset.count] || 0) + ')';
  }
}

function makeTag(text, extraClass) {
  const tag = document.createElement('span');
  tag.className = 'tag' + (extraClass ? ' ' + extraClass : '');
  tag.textContent = text;
  return tag;
}

function renderList() {
  listElement.replaceChildren();
  const shown = state.trophies.filter(trophyMatches);
  for (const trophy of shown) {
    const item = document.createElement('li');
    item.className = 'trophy' + (state.earned.has(trophy.id) ? ' earned' : '');
    item.dataset.id = String(trophy.id);

    const badge = document.createElement('span');
    badge.className = 'grade-badge grade-' + trophy.grade;
    badge.textContent = GRADE_LETTER[trophy.grade] || '?';
    badge.title = trophy.grade;
    item.append(badge);

    const body = document.createElement('div');
    body.className = 'trophy-body';

    const hidden = isSpoilerHidden(trophy);
    const heading = document.createElement('h3');
    heading.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    if (hidden) heading.classList.add('spoiler-hidden');
    body.append(heading);

    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = hidden ? 'Complete the story to reveal this trophy.' : trophy.description;
    if (hidden) desc.classList.add('spoiler-hidden');
    body.append(desc);

    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.append(makeTag(trophy.grade));
    const kindLabel = KIND_LABEL[trophy.kind] || trophy.kind;
    if (kindLabel !== trophy.grade) tags.append(makeTag(kindLabel));
    if (trophy.hidden) tags.append(makeTag('Hidden on PSN', 'hidden-tag'));
    if (trophy.missable) tags.append(makeTag('Missable', 'missable'));
    const count = formatCount(trophy);
    if (count !== null) tags.append(makeTag('Target: ' + count));
    tags.append(makeTag('Stage ' + trophy.stage));
    body.append(tags);

    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const check = document.createElement('label');
    check.className = 'earned-check';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(trophy.id);
    box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
    box.addEventListener('change', () => {
      toggleEarned(trophy.id);
    });
    check.append(box, document.createTextNode('Earned'));
    actions.append(check);

    const guideButton = document.createElement('button');
    guideButton.type = 'button';
    guideButton.textContent = state.selectedId === trophy.id ? 'Hide guide' : 'Guide & sources';
    if (hidden) {
      guideButton.disabled = true;
      guideButton.title = 'Earn this trophy to reveal its guide.';
    }
    guideButton.addEventListener('click', () => {
      state.selectedId = state.selectedId === trophy.id ? null : trophy.id;
      renderAll();
    });
    actions.append(guideButton);
    body.append(actions);
    item.append(body);
    listElement.append(item);
  }
  listMeta.textContent = 'Showing ' + shown.length + ' of ' + state.trophies.length + ' trophies'
    + (state.kind === 'online' ? ' — this list has no online trophies: all 55 are offline, single-player.' : '');
  emptyState.hidden = shown.length !== 0;
}

function renderDetailPanel() {
  if (state.selectedId === null) {
    detailElement.hidden = true;
    detailElement.replaceChildren();
    return;
  }
  const trophy = state.trophies.find((t) => t.id === state.selectedId);
  if (!trophy || isSpoilerHidden(trophy)) {
    detailElement.hidden = true;
    detailElement.replaceChildren();
    return;
  }
  renderDetail(detailElement, trophy, state.earned.has(trophy.id), {
    onToggleEarned: (id) => { toggleEarned(id); },
    onClose: () => { state.selectedId = null; renderAll(); },
  });
}

function renderAll() {
  renderProgress();
  renderChipCounts();
  renderList();
  renderDetailPanel();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveState({ earned: state.earned, spoilers: state.spoilers });
  renderAll();
}

function setView(view) {
  state.view = view === 'roadmap' ? 'roadmap' : 'checklist';
  document.getElementById('tabChecklist').classList.toggle('active', state.view === 'checklist');
  document.getElementById('tabRoadmap').classList.toggle('active', state.view === 'roadmap');
  document.getElementById('checklistView').hidden = state.view !== 'checklist';
  document.getElementById('roadmapView').hidden = state.view !== 'roadmap';
}

function setKind(kind) {
  state.kind = kind;
  for (const chip of document.querySelectorAll('#kindFilters .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === kind);
  }
  renderAll();
}

async function loadData() {
  const [trophiesResponse, roadmapResponse] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/roadmap.json'),
  ]);
  if (!trophiesResponse.ok || !roadmapResponse.ok) throw new Error('Could not load the trophy data.');
  const trophiesDoc = await trophiesResponse.json();
  state.trophies = trophiesDoc.trophies;
  state.roadmap = await roadmapResponse.json();
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const validIds = new Set(state.trophies.map((t) => t.id));
  const shared = readSharedEarned(params, validIds);
  for (const id of shared) state.earned.add(id);
  if (params.get('spoilers') === 'on') state.spoilers = true;
  if (params.get('search')) {
    state.search = params.get('search').toLowerCase();
    searchInput.value = params.get('search');
  }
  if (params.get('grade') && ['Platinum', 'Gold', 'Silver', 'Bronze'].includes(params.get('grade'))) {
    state.grade = params.get('grade');
    gradeSelect.value = state.grade;
  }
  if (params.get('kind') && ['story', 'missable', 'collectible', 'activity', 'online'].includes(params.get('kind'))) {
    state.kind = params.get('kind');
  }
  const guideId = Number(params.get('guide'));
  if (validIds.has(guideId)) state.selectedId = guideId;
  spoilerToggle.checked = state.spoilers;
  for (const chip of document.querySelectorAll('#kindFilters .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === state.kind);
  }
  setView(params.get('view'));
}

async function init() {
  const saved = loadSavedState();
  state.earned = new Set(saved.earned);
  state.spoilers = saved.spoilers;
  await loadData();
  applyUrlParams();
  saveState({ earned: state.earned, spoilers: state.spoilers });
  renderRoadmap(document.getElementById('roadmapStages'), document.getElementById('roadmapEstimate'), state.roadmap, state.trophies);

  document.getElementById('tabChecklist').addEventListener('click', () => { setView('checklist'); });
  document.getElementById('tabRoadmap').addEventListener('click', () => { setView('roadmap'); });
  document.getElementById('kindFilters').addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (chip) setKind(chip.dataset.kind);
  });
  gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; renderAll(); });
  searchInput.addEventListener('input', () => { state.search = searchInput.value.trim().toLowerCase(); renderAll(); });
  spoilerToggle.addEventListener('change', () => {
    state.spoilers = spoilerToggle.checked;
    saveState({ earned: state.earned, spoilers: state.spoilers });
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadProgressFile({ earned: state.earned, spoilers: state.spoilers });
    ioStatus.textContent = 'Progress exported as gta6-trophy-progress.json.';
  });
  document.getElementById('importInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const validIds = new Set(state.trophies.map((t) => t.id));
      const imported = await parseImportedFile(file, validIds);
      state.earned = new Set(imported.earned);
      state.spoilers = imported.spoilers;
      spoilerToggle.checked = state.spoilers;
      saveState({ earned: state.earned, spoilers: state.spoilers });
      ioStatus.textContent = 'Imported ' + state.earned.size + ' earned trophies from ' + file.name + '.';
    } catch (error) {
      ioStatus.textContent = error.message;
    }
    event.target.value = '';
    renderAll();
  });
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const url = buildShareUrl(state.earned);
    try {
      await navigator.clipboard.writeText(url);
      ioStatus.textContent = 'Share link copied to the clipboard.';
    } catch {
      ioStatus.textContent = 'Share link: ' + url;
    }
  });

  renderAll();
}

init().catch((error) => {
  listMeta.textContent = 'Could not load the trophy list: ' + error.message;
});
