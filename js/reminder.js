export function initDailyReminder() {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  setInterval(() => {
    const hour = new Date().getHours();
    const notified = localStorage.getItem("dailyNotified");

    if (hour === 20 && !notified) {
      new Notification("🧠 Life RPG", {
        body: "You still have daily quests to complete!",
      });

      localStorage.setItem("dailyNotified", "yes");
    }

    if (hour === 0) {
      localStorage.removeItem("dailyNotified");
    }
  }, 60 * 1000);
}
