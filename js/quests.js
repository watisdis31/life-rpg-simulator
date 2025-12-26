import { generateDailyQuests } from "./character.js";

export const QUESTS = [
  { text: "Clean your room", exp: 10, category: "Discipline" },
  { text: "Eat twice per day minimum", exp: 20, category: "Health" },
  { text: "Drink water", exp: 5, category: "Health" },
  { text: "Exercise 10 minutes", exp: 10, category: "Strength" },
  { text: "Take a shower", exp: 10, category: "Hygiene" },
  { text: "Take out the trash", exp: 5, category: "Discipline" },
  { text: "Study or do your work", exp: 15, category: "Intelligence" },
];

export function renderQuests(character, onCompleteCallback) {
  const questListEl = document.getElementById("questList");
  if (!questListEl) return;

  // Ensure daily quests exist (for old accounts)
  if (!character.quests) character.quests = {};
  if (!character.quests.daily) character.quests.daily = [];

  // Clear existing
  questListEl.innerHTML = "";

  character.quests.daily.forEach((q) => {
    if (typeof q.done === "undefined") q.done = false;

    const item = document.createElement("div");
    item.className =
      "quest-item p-2 mb-1 border rounded" + (q.done ? " done" : "");
    item.textContent = `${q.name} (+${q.exp} ${q.category})`;

    item.addEventListener("click", async () => {
      if (q.done) return;

      q.done = true;

      // If all quests are done, mark today as complete
      if (character.quests.daily.every((q) => q.done)) {
        character.quests.daily = [];
        character.stats.today.questsCompleted = true;
      }

      if (onCompleteCallback) await onCompleteCallback(q.exp, q.category);

      renderQuests(character, onCompleteCallback); // re-render instantly
    });

    questListEl.appendChild(item);
  });

  if (character.quests.daily.length === 0) {
    questListEl.innerHTML = "<i>No quests today — enjoy your free time! 🌱</i>";
  }
}
