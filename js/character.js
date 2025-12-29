import { QUESTS } from "./quests.js"; // <-- import master quest list

/* ===============================
   CATEGORY LIST
================================ */
export const CATEGORIES = [
  "Health",
  "Hygiene",
  "Discipline",
  "Strength",
  "Intelligence",
];

/* ===============================
   CHARACTER CREATION
================================ */
export function createCharacter(name) {
  const offset = new Date().getTimezoneOffset();
  const today = new Date(Date.now() - offset * 60000)
    .toISOString()
    .slice(0, 10);

  const character = {
    name,
    level: 1,
    exp: 0,
    avatar: null,
    timezoneOffset: new Date().getTimezoneOffset(),
    categoryExp: {},
    stats: {
      today: {
        date: today,
        totalExp: 0,
        byCategory: {},
        questsCompleted: false,
      },
      weekly: {},
    },
    badges: [],
    titles: [],
    completedToday: [],
    quests: { daily: generateDailyQuests() }, // populate quests for new account
  };
  return character;
}

/* ===============================
   EXP LOGIC
================================ */
export function addExp(character, exp, category) {
  character.exp += exp;

  // TODAY stats
  const today = character.stats.today;
  today.totalExp += exp;
  today.byCategory[category] = (today.byCategory[category] || 0) + exp;

  // CATEGORY cumulative EXP
  character.categoryExp[category] =
    (character.categoryExp[category] || 0) + exp;

  // WEEKLY stats
  const weekKey = character.stats.today.weekKey || getWeekKey(character);
  if (!character.stats.weekly[weekKey]) {
    character.stats.weekly[weekKey] = {
      totalExp: 0,
      days: {},
    };
  }

  const week = character.stats.weekly[weekKey];
  week.totalExp += exp;
  week.days[today.date] = true;

  // LEVEL UP logic
  const EXP_PER_LEVEL = 100;
  const newLevel = Math.floor(character.exp / EXP_PER_LEVEL) + 1;

  if (newLevel > character.level) {
    character.level = newLevel;
  }
}

/* ===============================
   DAILY RESET
================================ */
export function checkDailyReset(character) {
  // ===============================
  // 🛠️ MIGRATION FIX FOR OLD USERS
  // ===============================
  if (typeof character.timezoneOffset !== "number") {
    character.timezoneOffset = new Date().getTimezoneOffset();
  }

  if (!character.stats) {
    character.stats = { today: {}, weekly: {} };
  }

  if (!character.stats.today) {
    character.stats.today = {
      date: getLocalToday(character),
      totalExp: 0,
      byCategory: {},
      questsCompleted: false,
      weekKey: getWeekKey(character),
    };
  }

  // Old accounts might miss this flag
  if (typeof character.stats.today.questsCompleted !== "boolean") {
    character.stats.today.questsCompleted = false;
  }

  const todayStr = getLocalToday(character);

  // NEW DAY → full reset
  if (!character.stats.today || character.stats.today.date !== todayStr) {
    // ===============================
    // MISSED-DAY PENALTY
    // ===============================
    if (character.stats.today && character.stats.today.totalExp === 0) {
      const PENALTY_EXP = 10;
      const EXP_PER_LEVEL = 100;

      character.exp = Math.max(0, character.exp - PENALTY_EXP);
      character.level = Math.max(
        1,
        Math.floor(character.exp / EXP_PER_LEVEL) + 1,
      );
    }

    // ===============================
    // RESET FOR NEW DAY
    // ===============================
    character.stats.today = {
      date: todayStr,
      totalExp: 0,
      byCategory: {},
      questsCompleted: false,
    };

    character.completedToday = [];

    // Generate fresh quests for the new day
    character.quests = { daily: generateDailyQuests() };
    return;
  }

  if (!character.quests) {
    character.quests = { daily: [] };
  }
}

/* ===============================
   DAILY QUEST GENERATOR
================================ */
// Generate a fresh copy of daily quests
export function generateDailyQuests() {
  return QUESTS.map((q) => ({
    name: q.text,
    exp: q.exp,
    category: q.category,
    done: false,
  }));
}

/* ===============================
   WEEKLY STATS
================================ */
export function getWeeklyOrTodayStats(character) {
  const weekKey = character.stats.today.weekKey || getWeekKey(character);
  const week = character.stats.weekly[weekKey];

  if (week && week.totalExp > 0) {
    return {
      mode: "weekly",
      totalExp: week.totalExp,
      days: Object.keys(week.days).length,
    };
  }

  if (character.stats.today.totalExp > 0) {
    return {
      mode: "today",
      totalExp: character.stats.today.totalExp,
      categories: character.stats.today.byCategory,
    };
  }

  return { mode: "empty" };
}

/* ===============================
   BADGES
================================ */
export function calculateBadges(character) {
  const badges = [];
  const hasAnyHistory = Object.keys(character.stats.weekly || {}).length > 0;

  if (
    hasAnyHistory &&
    character.stats.today.date !== getLocalToday(character)
  ) {
    if (missedYesterday(character)) {
      badges.push("😴 Missed a Day");
    }

    if (missedDaysInRow(character, 3)) {
      badges.push("💀 Missed 3 Days in a Row");
    }
  }

  if (!hasAnyHistory) return badges;

  if (character.stats.today.totalExp > 0) badges.push("🟢 Productive Today");
  if (character.stats.today.totalExp === 0) badges.push("🦥 Lazy Day");

  const weeks = Object.values(character.stats.weekly || {});
  if (weeks.some((w) => w.totalExp >= 100)) badges.push("🔥 Grinder");

  // Streak badges
  const streak = getCurrentStreak(character);

  if (streak >= 3) {
    badges.push(`🔥 ${streak}-Day Streak`);
  }

  // Week streak
  const weekStreak = Math.floor(streak / 7);
  if (weekStreak >= 1) {
    badges.push(`💎 ${weekStreak}-Week Streak`);
  }

  // Month streak
  const months = Math.floor(streak / 30);
  if (months >= 1) {
    badges.push(`🌙 ${months}-Month Streak`);
  }

  // Year streak
  const years = Math.floor(streak / 365);
  if (years >= 1) {
    badges.push(`🏆 ${years}-Year Streak`);
  }

  return badges;
}

/* ===============================
   TITLES
================================ */
export function getTrainerTitle(character) {
  const badges = calculateBadges(character);
  const streak = getCurrentStreak(character);

  /* 🎮 Ultra Rare RNG Titles */
  if (Math.random() < 0.002) return "💎 Touches Code, Still Not Rich";
  if (Math.random() < 0.001) return "🧃 Productivity Influencer (0 Followers)";

  /* 🎮 Rare */
  if (Math.random() < 0.005) return "✨ Shiny Human";
  if (Math.random() < 0.003) return "🛸 Not From This Planet";

  /* 🧾 Joke Titles */
  if (character.stats.today.totalExp === 0) return "🌱 Touched Grass Once";

  if (badges.includes("🦥 Lazy Day")) return "🛌 Certified Bed Enjoyer";

  /* 🏅 Badge Titles */
  if (badges.includes("🔥 Grinder")) return "🏋️ I live for the EXP";

  if (badges.includes("😴 Missed a Day")) return "😶 It Was a Long Day, Okay?";

  /* 🦥 Absolute Gremlin Behavior */
  if (character.stats.today.totalExp === 0 && streak === 0)
    return "🪦 Logged In Just to Exist";

  if (badges.includes("🦥 Lazy Day") && streak === 0)
    return "🛋️ Professional Procrastinator";

  if (hasPreviousDays(character)) {
    if (missedDaysInRow(character, 3)) return "💀 Fell Off the Grindset";
  }

  /* 😴 Low Effort Energy */
  if (character.stats.today.totalExp > 0 && character.stats.today.totalExp < 20)
    return "☕ Bare Minimum Enthusiast";

  /* 🔥 Actually Trying */
  if (streak >= 3 && streak < 7) return "😤 Trying Their Best (Kinda)";

  if (streak >= 7 && streak < 30)
    return "🔥 Consistency Is a Myth (But Here You Are)";

  /* 🧠 Overachiever Problems */
  if (streak >= 30 && streak < 100)
    return "🧠 Needs Therapy, Chose Productivity";

  if (streak >= 100) return "🏆 Hasn’t Missed a Day Since the Incident";

  /* 📈 Level-Based Existential Titles */
  if (character.level >= 20 && character.level < 50)
    return "📈 Min-Maxing Life Instead of Money";

  if (character.level >= 50) return "🧬 This Is Their Personality Now";

  return "🌱 Just Getting Started";
}

/* ===============================
   HELPERS
================================ */
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey(character) {
  const offset = character.timezoneOffset ?? 0;

  const now = new Date(Date.now() - offset * 60000);

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffDays = Math.floor((now - startOfYear) / 86400000);

  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `${year}-W${week}`;
}

// Detect if yesterday was missed
function missedYesterday(character) {
  if (!character.stats?.today?.date) return false;

  const today = new Date(character.stats.today.date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const weeks = Object.values(character.stats.weekly || {});
  for (const week of weeks) {
    if (week.days[yesterdayStr]) return false; // active yesterday
  }

  return true; // missed yesterday
}

// Get set of active dates
function getActiveDays(character) {
  const days = new Set();
  const weeks = Object.values(character.stats.weekly || {});
  weeks.forEach((week) => {
    Object.keys(week.days || {}).forEach((d) => days.add(d));
  });
  return days;
}

// Calculate current streak
function getCurrentStreak(character) {
  const activeDays = getActiveDays(character);
  let streak = 0;

  let day = new Date(getLocalToday(character));

  while (true) {
    const dayStr = day.toISOString().slice(0, 10);
    if (!activeDays.has(dayStr)) break;

    streak++;
    day.setDate(day.getDate() - 1);
  }

  return streak;
}

// Missed N days in a row
function missedDaysInRow(character, daysMissed = 3) {
  const activeDays = getActiveDays(character);
  let misses = 0;

  let day = new Date(getLocalToday(character));
  day.setDate(day.getDate() - 1); // start from yesterday

  while (misses < daysMissed) {
    const dayStr = day.toISOString().slice(0, 10);
    if (activeDays.has(dayStr)) return false;

    misses++;
    day.setDate(day.getDate() - 1);
  }

  return true;
}

function hasPreviousDays(character) {
  const activeDays = getActiveDays(character);
  if (activeDays.size === 0) return false;

  const earliest = [...activeDays].sort()[0];
  const earliestDate = new Date(earliest);
  const today = new Date(getLocalToday(character));

  const diffDays = Math.floor((today - earliestDate) / 86400000);

  return diffDays >= 1;
}

function getLocalToday(character) {
  // Fallback for old accounts
  if (!character || typeof character.timezoneOffset !== "number") {
    return new Date().toISOString().slice(0, 10);
  }

  const offsetMs = character.timezoneOffset * 60 * 1000;
  const localTime = new Date(Date.now() - offsetMs);
  return localTime.toISOString().slice(0, 10);
}
