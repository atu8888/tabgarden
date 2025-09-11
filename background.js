importScripts("plant-database.js");
let isShopResetting = false;

let startOfSessionLog = null;
let lastDateTracked = null;

function getCurrentDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

function createTrackingAlarm() {
  chrome.alarms.create("trackingAlarm", { periodInMinutes: 1.0 });
  console.log("Tab Garden tracking alarm has been set.");
}

const SHOP_ITEM_POOL = {
  // Fertilizers
  common: { name: "Common Fertilizer", cost: 20, icon: "✨" },
  uncommon: { name: "Uncommon Fertilizer", cost: 40, icon: "✨" },
  rare: { name: "Rare Fertilizer", cost: 60, icon: "✨" },
  epic: { name: "Epic Fertilizer", cost: 80, icon: "✨" },
  legendary: { name: "Legendary Fertilizer", cost: 100, icon: "✨" },
  // Potions
  "dose-of-sunshine": { name: "Dose of Sunshine", cost: 25, icon: "❤️" },
  "aspirin-can": { name: "Aspirin Can", cost: 50, icon: "❤️" },
  "revive-stone": { name: "Revive Stone", cost: 100, icon: "❤️" },
};

const RARITY_WEIGHTS = {
  common: 16,
  uncommon: 8,
  rare: 4,
  epic: 2,
  legendary: 1,
};

async function resetDailyShop() {
  console.log("Running daily shop reset...");

  const itemKeys = Object.keys(SHOP_ITEM_POOL);
  const dailyShopItems = [];
  for (let i = 0; i < 3; i++) {
    const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    dailyShopItems.push({
      id: randomKey,
      ...SHOP_ITEM_POOL[randomKey],
      soldOut: false,
    });
  }

  const weightedSeeds = [];
  for (const plantId in PLANT_DATABASE) {
    const plant = PLANT_DATABASE[plantId];
    const weight = RARITY_WEIGHTS[plant.rarity] || 1;
    for (let i = 0; i < weight; i++) {
      weightedSeeds.push(plantId);
    }
  }

  const dailyShopSeeds = [];
  for (let i = 0; i < 3; i++) {
    const randomSeedId =
      weightedSeeds[Math.floor(Math.random() * weightedSeeds.length)];
    const seedData = PLANT_DATABASE[randomSeedId];
    dailyShopSeeds.push({
      id: randomSeedId,
      name: `${seedData.name} Seed`,
      cost: seedData.cost,
      icon: "🌱",
      soldOut: false,
    });
  }

  const today = getCurrentDateString();
  const shopDataToSave = {
    dailyShopItems,
    dailyShopSeeds,
    lastShopResetDate: today,
  };

  await new Promise((resolve) => {
    chrome.storage.local.set(shopDataToSave, () => {
      console.log(`Storage set successful. lastShopResetDate is now: ${today}`);
      resolve();
    });
  });
}

function setupDailyShopAlarm() {
  chrome.alarms.get("dailyShopReset", (alarm) => {
    if (!alarm) {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        5,
        0
      );
      chrome.alarms.create("dailyShopReset", {
        when: nextMidnight.getTime(),
        periodInMinutes: 24 * 60,
      });
      console.log("Daily shop reset alarm created.");
    }
  });
}

async function takeSnapshot() {
  const today = getCurrentDateString();
  const result = await chrome.storage.local.get("dailyProductivityLog");
  const log = result.dailyProductivityLog || {};
  startOfSessionLog = log[today] || { totalTime: 0, productiveTime: 0 };

  const { totalTime, productiveTime } = startOfSessionLog;
  let score = 0;
  if (totalTime > 0) score = (productiveTime / totalTime) * 100;

  console.log(
    `Previous session data loaded for ${today}: ${score.toFixed(
      0
    )}% productivity for ${formatTime(totalTime)}`
  );
}

async function logActivity(message) {
  const { activityLog = [] } = await chrome.storage.local.get("activityLog");
  activityLog.unshift({
    timestamp: new Date().toISOString(),
    message: message,
  });
  if (activityLog.length > 30) activityLog.pop();
  await chrome.storage.local.set({ activityLog });
  console.log(`Activity Logged: "${message}"`);
}

async function grantFertilizer(type) {
  const { fertilizerInventory } = await chrome.storage.local.get([
    "fertilizerInventory",
  ]);
  const { sessionRewardsEarned } = await chrome.storage.session.get([
    "sessionRewardsEarned",
  ]);

  fertilizerInventory[type] = (fertilizerInventory[type] || 0) + 1;
  sessionRewardsEarned[type] = true;

  await chrome.storage.local.set({ fertilizerInventory });
  await chrome.storage.session.set({ sessionRewardsEarned });

  const displayName = type.charAt(0).toUpperCase() + type.slice(1);
  console.log(
    `%cREWARD GRANTED: 1x ${displayName} Fertilizer!`,
    "color: #23a24d; font-weight: bold;"
  );

  await logActivity(`You earned a ${displayName} Fertilizer!`);
}

async function checkAndGrantRewards(productiveTime, totalTime, rewardsEarned) {
  const score = totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;

  if (!rewardsEarned.common && productiveTime >= 3600) {
    await grantFertilizer("common");
  }
  if (!rewardsEarned.uncommon && productiveTime >= 5400 && score >= 50) {
    await grantFertilizer("uncommon");
  }
  if (!rewardsEarned.rare && productiveTime >= 7200 && score >= 75) {
    await grantFertilizer("rare");
  }
  if (!rewardsEarned.epic && productiveTime >= 9000 && score >= 90) {
    await grantFertilizer("epic");
  }
  if (!rewardsEarned.legendary && productiveTime >= 10800 && score >= 100) {
    await grantFertilizer("legendary");
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tab Garden installed.");
  chrome.storage.local.set({
    productiveSites: [],
    unproductiveSites: [],
    dailyProductivityLog: {},
    plantInventory: {},
    seedInventory: ["rose", "sunflower"],
    currentPlantId: null,
    fertilizerInventory: {
      common: 1,
      uncommon: 1,
      rare: 1,
      epic: 1,
      legendary: 1,
    },
    potionInventory: {
      "dose-of-sunshine": 1,
      "aspirin-can": 1,
      "revive-stone": 1,
    },
    playerGold: 100,
    waterCanValue: 0,
    unproductiveEnergyCan: 0,
    activityLog: [],
    lastShopResetDate: null,
  });
  chrome.storage.session.set({
    sessionData: {},
    sessionRewardsEarned: {
      common: false,
      uncommon: false,
      rare: false,
      epic: false,
      legendary: false,
    },
  });
  createTrackingAlarm();
  setupDailyShopAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser startup detected.");
  createTrackingAlarm();
  setupDailyShopAlarm();
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "resetSession") {
    console.log("Snapshot and session rewards reset manually.");
    await chrome.storage.session.set({
      sessionData: {},
      sessionRewardsEarned: {
        common: false,
        uncommon: false,
        rare: false,
        epic: false,
        legendary: false,
      },
    });
    await takeSnapshot();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "ensureShopIsInitialized") {
    if (isShopResetting) {
      sendResponse({ success: true, message: "Reset already in progress." });
      return true;
    }

    try {
      isShopResetting = true;

      const today = getCurrentDateString();
      const { lastShopResetDate, dailyShopItems } =
        await chrome.storage.local.get(["lastShopResetDate", "dailyShopItems"]);
      if (
        lastShopResetDate !== today ||
        !dailyShopItems ||
        dailyShopItems.length === 0
      ) {
        console.log(
          `Resetting shop. Last reset: ${lastShopResetDate}, Today: ${today}.`
        );
        await resetDailyShop();
      } else {
        console.log("Shop is already up-to-date.");
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error ensuring shop state:", error);
      sendResponse({ success: false });
    } finally {
      isShopResetting = false;
    }
    return true;
  }
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyShopReset") {
    await resetDailyShop();
    return;
  }

  if (alarm.name === "trackingAlarm") {
    const today = getCurrentDateString();
    if (lastDateTracked !== today) {
      console.log(
        `Date changed from ${lastDateTracked} to ${today}. Resetting session.`
      );
      startOfSessionLog = null;
      await chrome.storage.session.set({ sessionData: {} });
    }
    lastDateTracked = today;
    if (startOfSessionLog === null) {
      await takeSnapshot();
    }

    const idleState = await chrome.idle.queryState(60);
    if (idleState !== "active") {
      console.log("User is idle. Tracking paused.");
      return;
    }

    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const activeTab = tabs[0];

    if (!activeTab?.url || !activeTab.url.startsWith("http")) return;

    const hostname = new URL(activeTab.url).hostname;
    const {
      productiveSites = [],
      unproductiveSites = [],
      waterCanValue = 0,
      unproductiveEnergyCan = 0,
      currentPlantId,
      plantInventory = {},
    } = await chrome.storage.local.get([
      "productiveSites",
      "unproductiveSites",
      "waterCanValue",
      "unproductiveEnergyCan",
      "currentPlantId",
      "plantInventory",
    ]);

    const alarmPeriodInSeconds = 60;

    if (productiveSites.includes(hostname)) {
      const newWaterValue = Math.min(100, waterCanValue + 1);
      if (newWaterValue === 100 && waterCanValue < 100) {
        await logActivity("Your water can is full!");
      }
      await chrome.storage.local.set({ waterCanValue: newWaterValue });
      console.log(`Productive time. Water can is now ${newWaterValue}% full.`);
    } else if (unproductiveSites.includes(hostname)) {
      let newUnproductiveEnergy = unproductiveEnergyCan + alarmPeriodInSeconds;
      console.log(
        `Unproductive time. Energy can at ${
          newUnproductiveEnergy / 60
        } minutes.`
      );

      if (
        newUnproductiveEnergy >= 600 &&
        currentPlantId &&
        plantInventory[currentPlantId]
      ) {
        const plant = plantInventory[currentPlantId];
        const plantRules = PLANT_DATABASE[plant.type].rules;
        const resilience = plantRules.resilience || 1;
        const damage = 1 / resilience;
        plant.currentHealth = Math.max(0, plant.currentHealth - damage);
        await logActivity(
          `Your ${plant.type} took ${damage.toFixed(
            1
          )} damage from unproductive time.`
        );
        console.log(
          `Applying ${damage.toFixed(2)} damage to ${
            plant.type
          }. New HP: ${plant.currentHealth.toFixed(2)}`
        );
        await chrome.storage.local.set({ plantInventory });
        newUnproductiveEnergy = 0;
      }
      await chrome.storage.local.set({
        unproductiveEnergyCan: newUnproductiveEnergy,
      });
    }

    const sessionResult = await chrome.storage.session.get([
      "sessionData",
      "sessionRewardsEarned",
    ]);
    let sessionData = sessionResult.sessionData || {};
    let sessionRewardsEarned = sessionResult.sessionRewardsEarned || {
      common: false,
      uncommon: false,
      rare: false,
      epic: false,
      legendary: false,
    };
    sessionData[hostname] = (sessionData[hostname] || 0) + 60;
    await chrome.storage.session.set({ sessionData: sessionData });

    const localResult = await chrome.storage.local.get([
      "dailyProductivityLog",
    ]);
    let log = localResult.dailyProductivityLog || {};

    let currentSessionProductiveTime = 0;
    let currentSessionTotalTime = 0;
    for (const site in sessionData) {
      const time = sessionData[site];
      currentSessionTotalTime += time;
      if (productiveSites.includes(site)) {
        currentSessionProductiveTime += time;
      }
    }

    await checkAndGrantRewards(
      currentSessionProductiveTime,
      currentSessionTotalTime,
      sessionRewardsEarned
    );

    const newDailyTotalTime =
      startOfSessionLog.totalTime + currentSessionTotalTime;
    const newDailyProductiveTime =
      startOfSessionLog.productiveTime + currentSessionProductiveTime;

    const todayLog = {
      totalTime: newDailyTotalTime,
      productiveTime: newDailyProductiveTime,
    };
    log[today] = todayLog;
    await chrome.storage.local.set({ dailyProductivityLog: log });
    console.log(`Updated daily log for ${today}:`, todayLog);
  }
});
