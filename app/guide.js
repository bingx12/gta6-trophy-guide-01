// The open guide panel: one trophy's official lines, its guide in our own
// words, the facts behind it (chapter, mission, count, roadmap stage) and
// the sources that back each fact, as links the reader can follow.
const GRADE_LETTER = { Platinum: 'P', Gold: 'G', Silver: 'S', Bronze: 'B' };
const KIND_LABEL = { story: 'Story', missable: 'Missable', collectible: 'Collectible', activity: 'Activity', online: 'Online', platinum: 'Platinum' };

export function formatCount(trophy) {
  if (trophy.count === null || trophy.count === undefined) return null;
  if (trophy.id === 52) return '$' + trophy.count.toLocaleString('en-US');
  if (trophy.id === 53) return '$' + trophy.count.toLocaleString('en-US');
  return String(trophy.count);
}

export function buildMetaLine(trophy) {
  const bits = [];
  bits.push('Grade: ' + trophy.grade);
  bits.push('Kind: ' + (KIND_LABEL[trophy.kind] || trophy.kind));
  if (trophy.hidden) bits.push('Hidden on PlayStation until earned');
  if (trophy.missable) bits.push('Possibly missable');
  if (trophy.chapter) bits.push(trophy.chapter);
  if (trophy.mission) bits.push('Mission: ' + trophy.mission);
  const count = formatCount(trophy);
  if (count !== null) bits.push('Target: ' + count);
  bits.push('Roadmap stage ' + trophy.stage);
  return bits.join(' · ');
}

export function renderDetail(container, trophy, isEarned, callbacks) {
  container.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = trophy.name;
  container.append(heading);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = 'Official: "' + trophy.description + '" — ' + trophy.grade;
  container.append(official);

  const meta = document.createElement('p');
  meta.className = 'meta-line';
  meta.textContent = buildMetaLine(trophy);
  container.append(meta);

  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  container.append(guide);

  const sourcesTitle = document.createElement('p');
  sourcesTitle.className = 'meta-line';
  sourcesTitle.textContent = 'Sources for the steps above — named beside the guide, never copied:';
  container.append(sourcesTitle);

  const list = document.createElement('ul');
  list.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    item.append(link);
    list.append(item);
  }
  container.append(list);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = isEarned ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => callbacks.onToggleEarned(trophy.id));
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close guide';
  close.addEventListener('click', () => callbacks.onClose());
  actions.append(toggle, close);
  container.append(actions);
  container.hidden = false;
  container.scrollIntoView({ block: 'nearest' });
}
