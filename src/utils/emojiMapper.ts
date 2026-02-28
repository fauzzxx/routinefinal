/**
 * Utility to map keywords to suitable emojis for social stories.
 */
const EMOJI_MAP: Record<string, string> = {
    dentist: '🦷',
    doctor: '👩‍⚕️',
    school: '🏫',
    wash: '🧼',
    sleep: '😴',
    happy: '😊',
    scared: '😟',
    play: '🧸',
    eat: '🍎',
    brush: '🪥',
    hair: '💇',
    shoes: '👟',
    clothes: '👕',
    bag: '🎒',
    bus: '🚌',
    teacher: '👩‍🏫',
    friend: '🧑‍🤝‍🧑',
    park: '🌳',
    bathroom: '🚽',
    water: '💧',
    soap: '🧼',
    towel: '🚿',
    bed: '🛏️',
    book: '📖',
    light: '💡',
    night: '🌙',
    morning: '☀️',
    food: '🍲',
    milk: '🥛',
    apple: '🍎',
    teeth: '🦷',
    mouth: '👄',
    hands: '👐',
    face: '👶',
    nervous: '😟',
    brave: '🦁',
    proud: '🎖️',
    calm: '🧘',
    listening: '👂',
    eyes: '👀',
    wait: '⏳',
    turn: '🔄',
    share: '🤝',
};

export const getEmojiForText = (text: string): string => {
    const lower = text.toLowerCase();
    for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
        if (lower.includes(keyword)) {
            return emoji;
        }
    }
    return '✨'; // Default emoji
};
