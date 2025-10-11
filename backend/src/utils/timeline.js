const narrators = new Set(['narration', 'narrator']);

const formatCharacterLine = ({ name, text }) => {
  const label = name ? `**${name}:**` : '**Character:**';
  return `${label} ${text}`;
};

const formatNarrationLine = (text) => text;

const formatSfxLine = ({ description, placeholder }) => {
  if (placeholder) {
    return `**${placeholder}** (${description || 'sound effect'})`;
  }

  return `*Sound effect:* ${description}`;
};

export const timelineToMarkdown = (timeline = []) => {
  return timeline
    .map((entry) => {
      if (!entry?.type) {
        return null;
      }

      switch (entry.type) {
        case 'narration':
        case 'narrator':
          return formatNarrationLine(entry.text);
        case 'character':
          return formatCharacterLine(entry);
        case 'sfx':
        case 'sound_effect':
          return formatSfxLine(entry);
        default:
          return entry.text || null;
      }
    })
    .filter(Boolean)
    .join('\n\n');
};

export const timelineDialogueText = (timeline = []) => {
  return timeline
    .flatMap((entry) => {
      if (!entry?.type) {
        return [];
      }

      if (narrators.has(entry.type)) {
        return entry.text ? [entry.text] : [];
      }

      if (entry.type === 'character') {
        return entry.text ? [`${entry.name ?? 'Character'} says ${entry.text}`] : [];
      }

      return [];
    })
    .join(' ');
};

export const normaliseTimelineEntry = (entry = {}) => {
  const rawType = entry.type ?? 'narration';
  const type = typeof rawType === 'string' ? rawType.toLowerCase() : 'narration';

  if (type === 'character') {
    return {
      type: 'character',
      name: entry.name,
      text: entry.text,
      traits: entry.traits ?? [],
    };
  }

  if (type === 'sfx' || type === 'sound_effect') {
    return {
      type: 'sfx',
      description: entry.description ?? entry.text ?? 'Ambient sound',
      placeholder: entry.placeholder,
    };
  }

  return {
    type: narrators.has(type) ? 'narration' : 'narration',
    text: entry.text,
  };
};
