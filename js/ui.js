// js/ui.js
import { calculateBadges, getWeeklyOrTodayStats, getTrainerTitle } from "./character.js";

export function renderTrainerCard(character) {
  const avatarHTML = character.avatar
    ? `<img src="${character.avatar}" class="avatar-img" id="avatarImg" />`
    : `<div class="avatar-circle" id="avatarImg">${character.name[0]}</div>`;

  let categoryHTML = "";
  if (character.categoryExp && Object.keys(character.categoryExp).length > 0) {
    categoryHTML = Object.entries(character.categoryExp)
      .map(([cat, exp]) => `<div>${cat}: +${exp} (Lvl ${calculateCategoryLevel(exp)})</div>`)
      .join("");
  } else {
    categoryHTML = "<i>No EXP yet</i>";
  }

  document.getElementById("trainerCard").innerHTML = `
    <div class="card p-3 trainer-card">
      <div class="d-flex align-items-center gap-3">
        <div class="avatar-wrapper" id="avatarWrapper">${avatarHTML}</div>
        <div>
          <input class="form-control form-control-sm trainer-name" value="${character.name}" onchange="updateName(this.value)" />
          <small class="text-muted">Lvl ${character.level}</small><br/>
          <small class="trainer-title">${getTrainerTitle(character)}</small>
        </div>
      </div>

      <div class="mt-2">
        <div class="exp-bar bg-light mt-2">
          <div class="progress-bar" style="width: ${getExpProgress(character)}%"></div>
        </div>
      </div>

      <div class="mt-2" id="badges">
        ${calculateBadges(character).map((b) => `<span class="badge bg-dark me-1">${b}</span>`).join("")}
      </div>

      <div class="mt-2 category-exp">
        <h6>Category EXP</h6>
        ${categoryHTML}
      </div>
    </div>
  `;

  // Make avatar wrapper clickable for uploading
  const avatarWrapper = document.getElementById("avatarWrapper");
  if (avatarWrapper) {
    avatarWrapper.addEventListener("click", () => {
      const avatarInput = document.getElementById("avatarInput");
      if (avatarInput) avatarInput.click();
    });
  }
}

export function renderWeeklyStats(character) {
  const stats = getWeeklyOrTodayStats(character);
  const el = document.getElementById("weeklyStats");

  if (stats.mode === "weekly") {
    el.innerHTML = `<b>This Week</b><br/>EXP: ${stats.totalExp}<br/>Active days: ${stats.days}`;
    return;
  }

  if (stats.mode === "today") {
    el.innerHTML = `<b>Week in progress</b><br/>Today EXP: ${stats.totalExp}`;
    return;
  }

  el.innerHTML = `<i>No activity yet — start your first quest 🚀</i>`;
}

/* ===============================
   HELPERS
================================ */
export function calculateCategoryLevel(exp) {
  return Math.floor(exp / 100) + 1;
}

export function getExpProgress(character) {
  const levelExp = 100;
  return Math.min((character.exp % levelExp) / levelExp, 1) * 100;
}
