importScripts(
  "lib/firebase-app-compat.js",
  "lib/firebase-auth-compat.js",
  "lib/firebase-firestore-compat.js",
  "firebase-config.js",
  "plant-database.js"
);

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let isShopResetting = false;
let startOfSessionLog = null;
let lastDateTracked = null;
let alarmCounter = 0;

// --- Offscreen Document Helpers ---
const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some((c) =>
    c.url.includes(chrome.runtime.id + OFFSCREEN_DOCUMENT_PATH)
  );
}

async function getAuthUser() {
  if ((await hasOffscreenDocument()) === false) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["DOM_PARSER"],
      justification:
        "Firebase Auth needs a DOM environment for session persistence.",
    });
  }

  const user = await chrome.runtime.sendMessage({
    action: "firebase-auth",
  });

  return user;
}

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

const POTION_SVG_ICON = `<svg class="potion-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path style="fill:#B4D8F1;" d="M298.667,176.044V0h-85.333v176.044c-73.61,18.945-128,85.766-128,165.289 C85.333,435.59,161.744,512,256,512s170.667-76.41,170.667-170.667C426.667,261.81,372.277,194.99,298.667,176.044z"/><path style="fill:#98C8ED;" d="M298.667,176.044V0H256v512c94.256,0,170.667-76.41,170.667-170.667 C426.667,261.81,372.277,194.99,298.667,176.044z"/><path style="fill:#E592BF;" d="M85.333,341.333C85.333,435.59,161.744,512,256,512s170.667-76.41,170.667-170.667H85.333z"/><rect x="213.333" style="fill:#A58868;" width="85.333" height="85.333"/><rect x="256" style="fill:#947859;" width="42.667" height="85.333"/><path style="fill:#E176AF;" d="M256,341.333V512c94.256,0,170.667-76.41,170.667-170.667H256z"/></g></svg>`;
const SEED_SVG_ICON = `<svg class="seed-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path style="fill:#23A24D;" d="M470.204,75.767c0,0-161.959,141.061-214.204,0C308.245-65.295,470.204,75.767,470.204,75.767z"/><path style="fill:#23A24D;" d="M41.796,75.767c0,0,161.959-141.061,214.204,0C203.756,216.828,41.796,75.767,41.796,75.767z"/></g><g><path style="fill:#008142;" d="M265.758,54.869c-3.546,6.182-6.847,13.037-9.758,20.898c52.245,141.061,214.204,0,214.204,0 s-10.818-9.395-27.697-20.898C397.574,85.491,309.435,131.016,265.758,54.869z"/><path style="fill:#008142;" d="M69.493,54.869C52.614,66.371,41.796,75.767,41.796,75.767s161.959,141.061,214.204,0 c-2.911-7.861-6.211-14.716-9.758-20.898C202.565,131.016,114.426,85.491,69.493,54.869z"/></g><path style="fill:#A26234;" d="M344.817,394.46c10.867-4.075,24.242-5.224,36.571-5.224c54.858,0,99.266,44.408,99.266,99.266 c0,3.553-0.209,7-0.522,10.449H31.869c-0.313-3.448-0.522-6.897-0.522-10.449c0-54.858,44.408-99.266,99.266-99.266 c12.33,0,25.704,1.149,36.571,5.224c15.569-34.586,48.483-57.469,88.816-57.469S329.248,359.875,344.817,394.46z"/><path style="fill:#8C552B;" d="M382.103,451.931c-12.329,0-25.704,1.149-36.571,5.224c-15.569-34.586-48.483-57.469-88.816-57.469 s-73.247,22.883-88.816,57.469c-10.867-4.075-24.242-5.224-36.571-5.224c-35.655,0-66.806,18.823-84.307,47.021h419.39 C448.909,470.754,417.759,451.931,382.103,451.931z"/><path d="M177.234,146.311c7.675,0,15.266-0.846,22.654-2.73c19.614-5.003,35.761-16.737,48.261-34.992v24.646h15.701v-24.668 c10.105,14.744,22.601,25.259,37.369,31.392c10.247,4.255,21.456,6.379,33.585,6.379c19.539-0.001,41.457-5.517,65.528-16.527 l-6.529-14.278c-34.88,15.951-64.003,19.291-86.561,9.925c-16.531-6.863-29.77-20.929-39.473-41.842h21.552l29.046,29.048 l11.103-11.102l-17.946-17.946h30.041l29.046,29.048l11.103-11.102l-17.946-17.946h33.293V67.916h-33.293l17.946-17.946 l-11.103-11.102l-29.046,29.048h-30.041L329.47,49.97l-11.103-11.102l-29.046,29.048h-21.57 c11.335-24.423,27.519-39.456,48.221-44.745C367.846,9.92,435.715,58.458,457.784,75.775c-8.789,6.916-24.853,18.797-44.309,29.717 l7.685,13.691c31-17.401,53.269-36.685,54.2-37.498l6.796-5.92l-6.796-5.92c-3.756-3.27-92.755-79.877-163.249-61.894 c-24.011,6.125-42.826,22.332-56.114,48.25c-11.025-21.477-25.89-36.333-44.347-44.261c-25.624-11.006-57.445-8.522-94.577,7.386 l6.182,14.432c33.025-14.147,60.683-16.633,82.199-7.392c16.205,6.96,29.211,20.926,38.778,41.547H222.68l-29.048-29.045 L182.53,49.97l17.946,17.946h-30.041l-29.048-29.048l-11.103,11.103l17.946,17.946h-33.292v15.701h33.292l-17.946,17.945 l11.103,11.102l29.048-29.048h30.041l-17.946,17.946l11.103,11.102l29.048-29.048h21.569 c-11.335,24.423-27.519,39.456-48.221,44.745C144.14,141.616,76.286,93.075,54.218,75.758c10.177-8.005,30.108-22.667,53.77-34.801 l-7.164-13.972c-35.997,18.46-63.05,41.874-64.184,42.862l-6.796,5.92l6.796,5.92C40.001,84.615,111.678,146.312,177.234,146.311z"/><rect x="78.367" y="454.53" style="fill:#FFFFFF;" width="20.899" height="15.701"/><rect x="99.26" y="433.627" width="20.898" height="15.701"/><g><rect x="151.513" y="449.306" style="fill:#FFFFFF;" width="20.898" height="15.701"/><rect x="224.658" y="376.162" style="fill:#FFFFFF;" width="20.898" height="15.701"/></g><rect x="245.55" y="397.054" width="20.898" height="15.701"/><rect x="224.658" y="449.306" width="20.898" height="15.701"/><g><rect x="276.899" y="459.753" style="fill:#FFFFFF;" width="20.898" height="15.701"/><rect x="412.732" y="449.306" style="fill:#FFFFFF;" width="20.898" height="15.701"/></g><rect x="391.84" y="428.403" width="20.898" height="15.701"/><rect x="350.044" y="449.306" width="20.898" height="15.701"/><path d="M488.47,491.1c0.022-0.877,0.034-1.741,0.034-2.598c0-59.063-48.052-107.115-107.116-107.115 c-12.785,0-23.494,1.167-32.491,3.555c-17.079-32.289-48.703-52.906-85.046-55.512V148.906h-15.701v180.522 c-36.342,2.605-67.966,23.223-85.045,55.512c-8.998-2.387-19.707-3.555-32.492-3.555c-59.063,0-107.115,48.052-107.115,107.115 c0,0.858,0.012,1.722,0.033,2.598H0v15.701h512v-15.701h-23.53V491.1z M39.198,488.502c0-50.406,41.008-91.414,91.414-91.414 c13.568,0,24.619,1.481,32.885,4.394c14.31,10.345,35.049,28.302,38.035,37.258l14.895-4.965 c-4.755-14.267-27.851-33.084-39.312-41.746c15.712-29.668,44.764-47.186,78.884-47.186c34.081,0,63.107,17.476,78.832,47.081 c-9.949,7.347-30.305,23.767-38.832,40.823l14.043,7.021c8.537-17.074,33.686-35.012,38.369-38.253 c8.275-2.935,19.358-4.428,32.978-4.428c50.406,0,91.415,41.008,91.415,91.414c0,0.85-0.017,1.718-0.043,2.598H39.24 C39.214,490.219,39.198,489.352,39.198,488.502z"/></g></svg>`;
const FERTILIZER_SVG_ICON = `<svg class="fertilizer-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><polygon style="fill:#AFB6BB;" points="435.464,472.412 461.856,504.082 50.144,504.082 76.536,472.412 76.536,446.021 435.464,446.021 "/><polygon style="fill:#AFB6BB;" points="461.856,7.918 435.464,39.588 435.464,71.258 76.536,71.258 76.536,39.588 50.144,7.918 "/></g><rect x="76.536" y="71.258" style="fill:#546A79;" width="358.928" height="374.763"/><rect x="76.536" y="113.485" style="fill:#344651;" width="358.928" height="290.309"/><path style="fill:#43B05C;" d="M256,150.433c0,0,142.515,163.629,0,216.412C113.485,314.062,256,150.433,256,150.433z"/><path d="M443.381,282.396h-15.835v155.707H84.454V79.175h343.093V256h15.835V42.455L478.76,0H33.24l35.379,42.455v427.09L33.24,512 h445.519l-35.378-42.455V282.396z M67.049,15.835h377.904L427.546,36.72v26.62H84.454V36.72L67.049,15.835z M444.951,496.165H67.049 l17.405-20.885v-21.341h343.093v21.341L444.951,496.165z"/><g><rect x="203.217" y="105.567" style="fill:#FFFFFF;" width="105.567" height="15.835"/><rect x="329.897" y="105.567" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="372.124" y="105.567" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="160.99" y="105.567" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="118.763" y="105.567" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="203.217" y="395.876" style="fill:#FFFFFF;" width="105.567" height="15.835"/><rect x="329.897" y="395.876" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="372.124" y="395.876" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="160.99" y="395.876" style="fill:#FFFFFF;" width="21.113" height="15.835"/><rect x="118.763" y="395.876" style="fill:#FFFFFF;" width="21.113" height="15.835"/></g><path d="M261.971,145.233L256,138.378l-5.971,6.854c-0.526,0.603-13.036,15.033-27.078,36.837l13.313,8.573 c7.634-11.853,14.884-21.53,19.726-27.683c17.487,22.283,66.554,90.867,53.159,143.299c-5.345,20.925-20.542,37.283-45.233,48.737 v-27.098l24.072-24.072l-11.196-11.197l-12.875,12.876v-30.39l24.072-24.072l-11.196-11.197l-12.876,12.876v-33.668h-15.835v33.668 l-12.876-12.876l-11.196,11.197l24.072,24.072v30.39l-12.876-12.876l-11.196,11.197l24.072,24.072v27.074 c-22.172-10.286-36.725-24.505-43.278-42.398c-6.827-18.638-8.637-52.065,21.508-105.468l-13.79-7.783 c-26.211,46.434-34.022,87.479-22.587,118.697c9.222,25.181,30.526,44.105,63.315,56.249l2.75,1.019l2.75-1.019 c36.195-13.405,58.316-34.979,65.749-64.118C342.665,238.941,265.274,149.026,261.971,145.233z"/></g></svg>`;

const SHOP_ITEM_POOL = {
  // Fertilizers
  common: { name: "Common Fertilizer", cost: 20, icon: FERTILIZER_SVG_ICON },
  uncommon: {
    name: "Uncommon Fertilizer",
    cost: 40,
    icon: FERTILIZER_SVG_ICON,
  },
  rare: { name: "Rare Fertilizer", cost: 60, icon: FERTILIZER_SVG_ICON },
  epic: { name: "Epic Fertilizer", cost: 80, icon: FERTILIZER_SVG_ICON },
  legendary: {
    name: "Legendary Fertilizer",
    cost: 100,
    icon: FERTILIZER_SVG_ICON,
  },
  // Potions
  "dose-of-sunshine": {
    name: "Dose of Sunshine",
    cost: 25,
    icon: POTION_SVG_ICON,
  },
  "aspirin-can": { name: "Aspirin Can", cost: 50, icon: POTION_SVG_ICON },
  "revive-stone": { name: "Revive Stone", cost: 100, icon: POTION_SVG_ICON },
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
      icon: SEED_SVG_ICON,
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

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser startup detected. Re-creating alarms.");
  createTrackingAlarm();
  setupDailyShopAlarm();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tab Garden installed.");
  createTrackingAlarm();
  setupDailyShopAlarm();
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
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const currentUser = await getAuthUser();

  if (alarm.name === "dailyShopReset") {
    await resetDailyShop();
    return;
  }

  if (alarm.name === "trackingAlarm") {
    const today = getCurrentDateString();

    if (lastDateTracked === null) {
      const result = await chrome.storage.session.get("lastDateTracked");
      lastDateTracked = result.lastDateTracked;
    }

    if (lastDateTracked !== today) {
      console.log(
        `Date changed from ${lastDateTracked} to ${today}. Resetting session.`
      );
      startOfSessionLog = null;
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
    }

    lastDateTracked = today;
    await chrome.storage.session.set({ lastDateTracked: today });

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

    alarmCounter++;
    if (alarmCounter >= 5) {
      alarmCounter = 0;
      if (currentUser) {
        const userRef = db.collection("users").doc(currentUser.uid);
        try {
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const score =
              newDailyTotalTime > 0
                ? (newDailyProductiveTime / newDailyTotalTime) * 100
                : 0;
            await userRef.update({
              productivityScore: Math.round(score),
            });

            console.log(
              `Synced productivity score for ${currentUser.email}: ${Math.round(
                score
              )}%`
            );
          } else {
            console.log(
              "User document doesn't exist yet for " +
                currentUser.email +
                ", skipping score sync."
            );
          }
        } catch (error) {
          console.error("Error syncing productivity score:", error);
        }
      } else {
        console.log("No user logged in, skipping score sync.");
      }
    }
  }
});
