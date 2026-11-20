// The roadmap view: the four stages to the Platinum, built from the same
// stage numbers the trophies carry, with the missable warning kept visible.
export function renderRoadmap(stagesContainer, estimateElement, roadmap, trophies) {
  estimateElement.textContent = roadmap.estimate;
  stagesContainer.replaceChildren();
  for (const stage of roadmap.stages) {
    const card = document.createElement('article');
    card.className = 'stage';

    const heading = document.createElement('h3');
    heading.textContent = 'Stage ' + stage.stage + ': ' + stage.title;
    const hours = document.createElement('span');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    heading.append(hours);
    card.append(heading);

    const summary = document.createElement('p');
    summary.textContent = stage.summary;
    card.append(summary);

    if (Array.isArray(stage.tips) && stage.tips.length > 0) {
      const tips = document.createElement('ul');
      for (const tip of stage.tips) {
        const item = document.createElement('li');
        item.textContent = tip;
        tips.append(item);
      }
      card.append(tips);
    }

    if (stage.warning) {
      const warning = document.createElement('p');
      warning.className = 'stage-warning';
      warning.textContent = stage.warning;
      card.append(warning);
    }

    const names = trophies.filter((t) => t.stage === stage.stage).map((t) => t.name);
    if (names.length > 0) {
      const chips = document.createElement('div');
      chips.className = 'stage-trophies';
      for (const name of names) {
        const chip = document.createElement('span');
        chip.textContent = name;
        chips.append(chip);
      }
      card.append(chips);
    }
    stagesContainer.append(card);
  }
}
