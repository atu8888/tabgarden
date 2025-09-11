document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll("nav .radio");
  const pages = document.querySelectorAll(".page");
  const plantNameDisplay = document.getElementById("plant-name-display");
  const plantAnimationBox = document.getElementById("plant-animation-box");
  const plantStats = document.getElementById("plant-stats");
  const noPlantView = document.getElementById("no-plant-view");
  const seedDropdown = document.getElementById("seed-dropdown");
  const plantBtn = document.getElementById("action-plant");
  const fertilizerDropdown = document.getElementById("fertilizer-dropdown");
  const transferBtn = document.getElementById("action-transfer");
  const fertilizerBtn = document.getElementById("action-fertilize");
  const reviveBtn = document.getElementById("action-revive");
  const reviveDropdown = document.getElementById("revive-dropdown");
  const sellPlantBtn = document.getElementById("sell-plant-btn");
  const MAX_GARDEN_SIZE = 8;
  let isPurchasing = false;

  function timeAgo(isoString) {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  }

  function displayActivityLog() {
    const dropdown = document.getElementById("activity-log-dropdown");
    chrome.storage.local.get("activityLog", (data) => {
      const { activityLog = [] } = data;
      dropdown.innerHTML = "";

      if (activityLog.length === 0) {
        dropdown.innerHTML = "<span>No recent activity.</span>";
        return;
      }

      const ul = document.createElement("ul");
      activityLog.forEach((entry) => {
        const li = document.createElement("li");
        const messageSpan = document.createElement("span");
        const timeSpan = document.createElement("span");

        messageSpan.textContent = entry.message;
        timeSpan.textContent = timeAgo(entry.timestamp);
        timeSpan.className = "log-time";

        li.appendChild(messageSpan);
        li.appendChild(timeSpan);
        ul.appendChild(li);
      });
      dropdown.appendChild(ul);
    });
  }

  function formatTime(seconds) {
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }

  function setStaticFrame(plantSprite, animData, frame) {
    plantSprite.style.backgroundImage = `url(${animData.sprite})`;
    plantSprite.style.backgroundSize = `${animData.totalFrames * 100}% 100%`;
    const position = `${((frame - 1) / (animData.totalFrames - 1)) * 100}%`;
    plantSprite.style.backgroundPositionX = position;
  }

  /**
   * Determines the correct growth stage object based on the plant's growth percentage.
   * @param {object} plantData - The plant's data from PLANT_DATABASE.
   * @param {number} growth - The current growth percentage.
   * @returns {object} The stage object { threshold, image }.
   */
  function getStageForGrowth(plantData, growth) {
    let currentStage = plantData.growthStages[0];
    for (const stage of plantData.growthStages) {
      if (growth >= stage.threshold) {
        currentStage = stage;
      } else {
        break;
      }
    }
    return currentStage;
  }

  function displayCurrentPlant() {
    const healthBarFill = document.getElementById("health-bar-fill");
    const growthBarFill = document.getElementById("growth-bar-fill");
    const plantSprite = document.getElementById("plant-sprite");

    chrome.storage.local.get(["currentPlantId", "plantInventory"], (data) => {
      const { currentPlantId, plantInventory } = data;

      if (currentPlantId && plantInventory && plantInventory[currentPlantId]) {
        const plant = plantInventory[currentPlantId];
        const plantData = PLANT_DATABASE[plant.type];

        plantNameDisplay.textContent = plantData.name;
        document.getElementById("plant-id-data").textContent = plant.instanceId;
        document.getElementById("plant-name-data").textContent = plantData.name;
        document.getElementById("plant-desc-data").textContent =
          plantData.description;
        document.getElementById("plant-date-data").textContent =
          plant.dayPlanted;
        document.getElementById(
          "plant-hp-data"
        ).textContent = `${plant.currentHealth}/100`;
        document.getElementById(
          "plant-growth-data"
        ).textContent = `${plant.currentGrowth}%`;

        const targetStage = getStageForGrowth(plantData, plant.currentGrowth);
        const displayedThreshold = parseInt(
          plantSprite.dataset.threshold || -1
        );
        const animData = plantData.animationData;

        if (displayedThreshold !== targetStage.threshold) {
          const transition = plantData.transitions[targetStage.threshold];

          if (transition && animData) {
            const steps = transition.endFrame - transition.startFrame;
            const startPos = `${
              ((transition.startFrame - 1) / (animData.totalFrames - 1)) * 100
            }%`;
            const endPos = `${
              ((transition.endFrame - 1) / (animData.totalFrames - 1)) * 100
            }%`;

            plantSprite.classList.remove("is-animating");
            void plantSprite.offsetWidth;

            plantSprite.style.setProperty(
              "--sprite-width",
              `${animData.totalFrames * 100}%`
            );
            plantSprite.style.setProperty("--steps", steps);
            plantSprite.style.setProperty("--duration", transition.duration);
            plantSprite.style.setProperty("--start-pos", startPos);
            plantSprite.style.setProperty("--end-pos", endPos);

            plantSprite.style.backgroundImage = `url(${animData.sprite})`;
            plantSprite.classList.add("is-animating");

            plantSprite.addEventListener(
              "animationend",
              () => {
                plantSprite.classList.remove("is-animating");
                setStaticFrame(plantSprite, animData, targetStage.staticFrame);
              },
              { once: true }
            );
          } else if (animData) {
            setStaticFrame(plantSprite, animData, targetStage.staticFrame);
          }
          plantSprite.dataset.threshold = targetStage.threshold;
        } else if (!plantSprite.style.backgroundImage && animData) {
          setStaticFrame(plantSprite, animData, targetStage.staticFrame);
        }

        healthBarFill.style.width = `${plant.currentHealth}%`;
        growthBarFill.style.width = `${plant.currentGrowth}%`;
      } else {
        plantNameDisplay.textContent = "None";
        document.getElementById("plant-id-data").textContent = "N/A";
        document.getElementById("plant-name-data").textContent = "N/A";
        document.getElementById("plant-desc-data").textContent =
          "No plant is active.";
        document.getElementById("plant-date-data").textContent = "N/A";
        document.getElementById("plant-hp-data").textContent = "N/A";
        document.getElementById("plant-growth-data").textContent = "N/A";
        healthBarFill.style.width = "0%";
        growthBarFill.style.width = "0%";
        plantSprite.style.backgroundImage = "none";
        plantSprite.removeAttribute("data-threshold");
      }
    });
  }

  function updateSellDropdown() {
    chrome.storage.local.get(["plantInventory", "currentPlantId"], (data) => {
      const { plantInventory = {}, currentPlantId } = data;
      const sellDropdown = document.getElementById("sell-plant-dropdown");
      sellDropdown.innerHTML = "";

      const inventoryContainer = document.createElement("div");
      inventoryContainer.id = "plant-inventory-container";
      sellDropdown.appendChild(inventoryContainer);

      const title = document.createElement("h4");
      title.textContent = "Plants to Sell:";
      inventoryContainer.appendChild(title);

      const buttonListContainer = document.createElement("div");
      buttonListContainer.className = "button-list-container";
      inventoryContainer.appendChild(buttonListContainer);

      const sellablePlants = Object.values(plantInventory).filter(
        (p) => p.currentGrowth === 100 && p.instanceId !== currentPlantId
      );

      if (sellablePlants.length === 0) {
        const noItemsEl = document.createElement("span");
        noItemsEl.textContent = "No plants are ready to sell.";
        buttonListContainer.appendChild(noItemsEl);
        return;
      }

      sellablePlants.forEach((plant) => {
        const plantData = PLANT_DATABASE[plant.type];
        const button = document.createElement("button");
        button.className = "sell-item-btn";

        button.textContent = `🌸 ${plantData.name} for ${plantData.sellValue}💰`;

        button.addEventListener("click", () => sellPlant(plant.instanceId));
        buttonListContainer.appendChild(button);
      });
    });
  }

  async function sellPlant(instanceId) {
    const data = await chrome.storage.local.get([
      "plantInventory",
      "playerGold",
      "activityLog",
    ]);
    const plantToSell = data.plantInventory[instanceId];
    if (!plantToSell) return;

    const plantData = PLANT_DATABASE[plantToSell.type];
    const sellValue = plantData.sellValue;

    data.playerGold += sellValue;
    delete data.plantInventory[instanceId];

    data.activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `You sold a ${plantData.name} for ${sellValue} gold.`,
    });
    if (data.activityLog.length > 30) data.activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: data.plantInventory,
      playerGold: data.playerGold,
      activityLog: data.activityLog,
    });

    alert(`You sold your ${plantData.name} for ${sellValue} gold!`);

    await renderGardenPlots();
    await updateSellDropdown();
    document.getElementById("sell-plant-dropdown").classList.remove("open");
  }

  function updatePlantDropdown() {
    chrome.storage.local.get(
      ["seedInventory", "plantInventory", "currentPlantId"],
      (data) => {
        const {
          seedInventory = [],
          plantInventory = {},
          currentPlantId,
        } = data;
        seedDropdown.innerHTML = "";

        const inventoryContainer = document.createElement("div");
        inventoryContainer.id = "plant-inventory-container";
        seedDropdown.appendChild(inventoryContainer);

        const title = document.createElement("h4");
        title.textContent = "Your Inventory";
        inventoryContainer.appendChild(title);

        const buttonListContainer = document.createElement("div");
        buttonListContainer.className = "button-list-container";
        inventoryContainer.appendChild(buttonListContainer);

        const isPlantActive = currentPlantId !== null;
        const allPlants = Object.values(plantInventory);

        if (seedInventory.length === 0 && allPlants.length === 0) {
          const noItemsEl = document.createElement("span");
          noItemsEl.textContent = "Your inventory is empty.";
          buttonListContainer.appendChild(noItemsEl);
          return;
        }

        seedInventory.forEach((seedType) => {
          const seedData = PLANT_DATABASE[seedType];
          const button = document.createElement("button");
          button.textContent = `🌱 ${seedData.name} (Seed)`;
          button.dataset.seedType = seedType;
          button.disabled = isPlantActive;
          if (isPlantActive) {
            button.title = "Transfer your current plant to plant a new seed.";
          }
          button.addEventListener("click", () => plantSeed(seedType));
          buttonListContainer.appendChild(button);
        });

        allPlants.forEach((plant) => {
          const plantData = PLANT_DATABASE[plant.type];
          const button = document.createElement("button");
          button.textContent = `🌸 ${plantData.name} (${plant.currentGrowth}%)`;

          if (plant.instanceId === currentPlantId) {
            button.textContent += " (Active)";
            button.disabled = true;
          } else {
            button.disabled = isPlantActive;
            if (isPlantActive) {
              button.title = "Transfer your current plant to switch.";
            }
            button.addEventListener("click", () =>
              setActivePlant(plant.instanceId)
            );
          }
          buttonListContainer.appendChild(button);
        });
      }
    );
  }

  function setActivePlant(plantInstanceId) {
    chrome.storage.local.set({ currentPlantId: plantInstanceId }, () => {
      console.log(`Switched active plant to: ${plantInstanceId}`);
      displayCurrentPlant();
      updatePlantDropdown();
      seedDropdown.classList.remove("open");
      updateFertilizerDropdown();
      updatePotionDropdown();
    });
  }

  function plantSeed(seedType) {
    chrome.storage.local.get(
      ["seedInventory", "plantInventory", "currentPlantId"],
      (data) => {
        if (data.currentPlantId) {
          alert("Please transfer your current plant to the garden first!");
          return;
        }
        const plantCount = Object.keys(data.plantInventory).length;
        if (plantCount >= MAX_GARDEN_SIZE + 1) {
          alert(
            `Your garden and active slot are full! You cannot have more than ${
              MAX_GARDEN_SIZE + 1
            } plants.`
          );
          return;
        }

        const { seedInventory, plantInventory } = data;

        const instanceId = `${seedType}_${Date.now()}`;
        const newPlant = {
          instanceId: instanceId,
          type: seedType,
          dayPlanted: new Date().toISOString().slice(0, 10),
          currentHealth: 50,
          currentGrowth: 0,
        };

        plantInventory[instanceId] = newPlant;
        const seedIndex = seedInventory.indexOf(seedType);
        if (seedIndex > -1) {
          seedInventory.splice(seedIndex, 1);
        }

        chrome.storage.local.set(
          {
            plantInventory: plantInventory,
            seedInventory: seedInventory,
            currentPlantId: instanceId,
          },
          () => {
            console.log(
              `${seedType} planted! New current plant is ${instanceId}`
            );
            displayCurrentPlant();
            updatePlantDropdown();
            seedDropdown.classList.remove("open");
            updateFertilizerDropdown();
            updatePotionDropdown();
          }
        );
      }
    );
  }

  function updateWaterLevelDisplay() {
    const waterBtn = document.getElementById("action-water");
    chrome.storage.local.get("waterCanValue", (data) => {
      const waterCanValue = data.waterCanValue || 0;
      waterBtn.title = `Water (${waterCanValue}% Full)`;
    });
  }

  function updatePotionDropdown() {
    chrome.storage.local.get(["potionInventory", "currentPlantId"], (data) => {
      const { potionInventory = {}, currentPlantId } = data;
      reviveDropdown.innerHTML = "";

      const inventoryContainer = document.createElement("div");
      inventoryContainer.id = "plant-inventory-container";
      reviveDropdown.appendChild(inventoryContainer);

      const title = document.createElement("h4");
      title.textContent = "Your Potions";
      inventoryContainer.appendChild(title);

      const buttonListContainer = document.createElement("div");
      buttonListContainer.className = "button-list-container";
      inventoryContainer.appendChild(buttonListContainer);

      const isPlantActive = currentPlantId !== null;
      const potionTypes = Object.keys(potionInventory).filter(
        (type) => potionInventory[type] > 0
      );

      if (potionTypes.length === 0) {
        const noItemsEl = document.createElement("span");
        noItemsEl.textContent = "You have no potions.";
        buttonListContainer.appendChild(noItemsEl);
        return;
      }

      potionTypes.forEach((type) => {
        const count = potionInventory[type];
        const button = document.createElement("button");
        const displayName = type
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        button.textContent = `❤️ ${displayName} (x${count})`;
        button.dataset.potionType = type;
        button.disabled = !isPlantActive;
        if (!isPlantActive) {
          button.title = "A plant must be active to use a potion.";
        }

        button.addEventListener("click", () => usePotion(type));
        buttonListContainer.appendChild(button);
      });
    });
  }

  async function usePotion(potionType) {
    const data = await chrome.storage.local.get([
      "potionInventory",
      "plantInventory",
      "currentPlantId",
      "activityLog",
    ]);

    const {
      potionInventory,
      plantInventory,
      currentPlantId,
      activityLog = [],
    } = data;

    if (!currentPlantId || !plantInventory[currentPlantId]) {
      console.error("No active plant to use potion on.");
      return;
    }
    if (!potionInventory[potionType] || potionInventory[potionType] <= 0) {
      console.error("No potion of that type left.");
      return;
    }

    const plant = plantInventory[currentPlantId];
    const potionEffects = {
      "dose-of-sunshine": 10,
      "aspirin-can": 20,
      "revive-stone": 50,
    };

    const hpToAdd = potionEffects[potionType] || 0;
    const displayName = potionType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    plant.currentHealth = Math.min(100, plant.currentHealth + hpToAdd);
    potionInventory[potionType] -= 1;

    activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `Used a ${displayName}, restoring ${hpToAdd} HP.`,
    });
    if (activityLog.length > 30) activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: plantInventory,
      potionInventory: potionInventory,
      activityLog: activityLog,
    });

    console.log(`Used ${potionType}. Restored ${hpToAdd} HP.`);
    alert(`You used a ${displayName} and restored ${hpToAdd} HP!`);

    displayCurrentPlant();
    updatePotionDropdown();
    displayActivityLog();
    reviveDropdown.classList.remove("open");
  }

  function updateFertilizerDropdown() {
    chrome.storage.local.get(
      ["fertilizerInventory", "currentPlantId"],
      (data) => {
        const { fertilizerInventory = {}, currentPlantId } = data;
        fertilizerDropdown.innerHTML = "";

        const inventoryContainer = document.createElement("div");
        inventoryContainer.id = "plant-inventory-container";
        fertilizerDropdown.appendChild(inventoryContainer);

        const title = document.createElement("h4");
        title.textContent = "Your Fertilizers";
        inventoryContainer.appendChild(title);

        const buttonListContainer = document.createElement("div");
        buttonListContainer.className = "button-list-container";
        inventoryContainer.appendChild(buttonListContainer);

        const isPlantActive = currentPlantId !== null;

        const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];

        const ownedFertilizerTypes = Object.keys(fertilizerInventory).filter(
          (type) => fertilizerInventory[type] > 0
        );

        const sortedFertilizerTypes = ownedFertilizerTypes.sort(
          (a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b)
        );

        if (sortedFertilizerTypes.length === 0) {
          const noItemsEl = document.createElement("span");
          noItemsEl.textContent = "You have no fertilizer.";
          buttonListContainer.appendChild(noItemsEl);
          return;
        }

        sortedFertilizerTypes.forEach((type) => {
          const count = fertilizerInventory[type];
          const button = document.createElement("button");
          const displayName = type.charAt(0).toUpperCase() + type.slice(1);
          button.textContent = `✨ ${displayName} (x${count})`;
          button.dataset.fertilizerType = type;
          button.disabled = !isPlantActive;
          if (!isPlantActive) {
            button.title = "A plant must be active to use fertilizer.";
          }

          button.addEventListener("click", () => useFertilizer(type));
          buttonListContainer.appendChild(button);
        });
      }
    );
  }

  function useFertilizer(type) {
    chrome.storage.local.get(
      ["fertilizerInventory", "plantInventory", "currentPlantId"],
      (data) => {
        const { fertilizerInventory, plantInventory, currentPlantId } = data;

        if (!currentPlantId || !plantInventory[currentPlantId]) {
          console.error("No active plant to fertilize.");
          return;
        }
        if (!fertilizerInventory[type] || fertilizerInventory[type] <= 0) {
          console.error("No fertilizer of that type left.");
          return;
        }

        const plant = plantInventory[currentPlantId];
        const plantRules = PLANT_DATABASE[plant.type].rules;

        if (plant.currentHealth < plantRules.growthThreshold) {
          console.log(
            `Plant HP (${plant.currentHealth}) is below threshold (${plantRules.growthThreshold}). Fertilizer has no effect.`
          );
          alert(
            `Your ${plant.type}'s health is too low! Water it before using fertilizer.`
          );
          return;
        }

        const baseGrowthValues = {
          common: 5,
          uncommon: 10,
          rare: 15,
          epic: 20,
          legendary: 25,
        };
        const baseGrowth = baseGrowthValues[type] || 0;
        const hpPercent = plant.currentHealth / 100;
        const growthRate = plantRules.growthRate || 1;

        const actualGrowth = Math.floor(baseGrowth * hpPercent * growthRate);

        plant.currentGrowth = Math.min(100, plant.currentGrowth + actualGrowth);
        fertilizerInventory[type] -= 1;

        chrome.storage.local.set(
          {
            plantInventory: plantInventory,
            fertilizerInventory: fertilizerInventory,
          },
          () => {
            console.log(
              `Used ${type} fertilizer. Added ${actualGrowth} growth. New total: ${plant.currentGrowth}`
            );
            displayCurrentPlant();
            updateFertilizerDropdown();
            fertilizerDropdown.classList.remove("open");
          }
        );
      }
    );
  }

  async function waterPlant() {
    const data = await chrome.storage.local.get([
      "waterCanValue",
      "plantInventory",
      "currentPlantId",
      "activityLog",
    ]);

    const {
      waterCanValue,
      plantInventory,
      currentPlantId,
      activityLog = [],
    } = data;

    if (!currentPlantId || !plantInventory[currentPlantId]) {
      alert("You must have an active plant to water!");
      return;
    }

    const plant = plantInventory[currentPlantId];
    const hpToAdd = Math.floor(waterCanValue / 10);

    if (hpToAdd <= 0) {
      alert(
        "Your water can is empty! Spend time on productive sites to fill it."
      );
      return;
    }

    plant.currentHealth = Math.min(100, plant.currentHealth + hpToAdd);

    activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `You watered your plant for ${hpToAdd} HP.`,
    });
    if (activityLog.length > 30) activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: plantInventory,
      waterCanValue: 0,
      activityLog: activityLog,
    });

    console.log(
      `Watered plant for ${hpToAdd} HP. New HP: ${plant.currentHealth}. Water can reset.`
    );
    alert(`You watered your plant and restored ${hpToAdd} HP!`);

    displayCurrentPlant();
    updateWaterLevelDisplay();
    displayActivityLog();
  }

  function displayStats() {
    chrome.storage.session.get(["sessionData"], (result) => {
      const sessionData = result.sessionData || {};
      const statsContainer = document.getElementById("stats-container");
      statsContainer.innerHTML = "";
      const sortedSites = Object.entries(sessionData).sort(
        ([, a], [, b]) => b - a
      );
      if (sortedSites.length === 0) {
        statsContainer.textContent =
          "No activity tracked yet for this session.";
        document.getElementById("productivity-score-header").textContent = "0";
        document.getElementById("debug-total").textContent = "0 min";
        document.getElementById("debug-productive").textContent = "0 min";
        document.getElementById("debug-unproductive").textContent = "0 min";
        return;
      }
      for (const [hostname, time] of sortedSites) {
        const siteElement = document.createElement("div");
        siteElement.className = "site-stat";
        siteElement.textContent = `${hostname}: ${formatTime(time)}`;
        statsContainer.appendChild(siteElement);
      }
      chrome.storage.local.get(
        ["productiveSites", "unproductiveSites"],
        (storage) => {
          const productiveSites = storage.productiveSites || [];
          const unproductiveSites = storage.unproductiveSites || [];
          let totalProductiveTime = 0,
            totalUnproductiveTime = 0,
            totalSessionTime = 0;
          for (const [hostname, time] of sortedSites) {
            totalSessionTime += time;
            if (productiveSites.includes(hostname)) {
              totalProductiveTime += time;
            } else if (unproductiveSites.includes(hostname)) {
              totalUnproductiveTime += time;
            }
          }
          document.getElementById("debug-total").textContent =
            formatTime(totalSessionTime);
          document.getElementById("debug-productive").textContent =
            formatTime(totalProductiveTime);
          document.getElementById("debug-unproductive").textContent =
            formatTime(totalUnproductiveTime);
          let score = 0;
          if (totalSessionTime > 0) {
            score = (totalProductiveTime / totalSessionTime) * 100;
          }
          document.getElementById("productivity-score-header").textContent =
            score.toFixed(0);
        }
      );
    });
  }

  let currentGardenPage = 0;

  async function renderGardenPlots() {
    const mainGardenDisplay = document.getElementById("main-garden-display");
    mainGardenDisplay.innerHTML = "";

    const data = await chrome.storage.local.get([
      "plantInventory",
      "currentPlantId",
    ]);
    const { plantInventory = {}, currentPlantId } = data;

    const gardenPlants = Object.values(plantInventory).filter(
      (p) => p.instanceId !== currentPlantId
    );

    let currentPage = null;

    for (let i = 0; i < MAX_GARDEN_SIZE; i++) {
      if (i % 4 === 0) {
        currentPage = document.createElement("div");
        currentPage.className = "garden-plot-page";
        mainGardenDisplay.appendChild(currentPage);
      }

      const plotContainer = document.createElement("div");
      plotContainer.className = "garden-plant-container";

      const plantForThisPlot = gardenPlants[i];

      if (plantForThisPlot) {
        const plantData = PLANT_DATABASE[plantForThisPlot.type];
        const stage = getStageForGrowth(
          plantData,
          plantForThisPlot.currentGrowth
        );
        const animData = plantData.animationData;

        plotContainer.innerHTML = `
          <div class="plant-name">${plantData.name}</div>
          <div class="plant-image-container">
            <div class="garden-plant-sprite"></div>
          </div>
          <div class="plant-stats-display">
            <span>HP: ${Math.floor(plantForThisPlot.currentHealth)}/100</span>
            <span>Growth: ${plantForThisPlot.currentGrowth}%</span>
          </div>
        `;

        const spriteEl = plotContainer.querySelector(".garden-plant-sprite");
        if (spriteEl && animData) {
          spriteEl.style.backgroundImage = `url(${animData.sprite})`;
          spriteEl.style.backgroundSize = `${animData.totalFrames * 100}% 100%`;
          const position = `${
            ((stage.staticFrame - 1) / (animData.totalFrames - 1)) * 100
          }%`;
          spriteEl.style.backgroundPositionX = position;
        }
      } else {
        plotContainer.innerHTML = `
          <div class="plant-name">(Empty Plot)</div>
          <div class="plant-image-container"></div>
          <div class="plant-stats-display">
            <span>HP: --</span>
            <span>Growth: --</span>
          </div>
        `;
      }
      currentPage.appendChild(plotContainer);
    }
  }

  async function updateGardenPage() {
    await renderGardenPlots();
    await updateSellDropdown();
    updateGardenDisplay();
  }

  function updateGardenDisplay() {
    const mainGardenDisplay = document.getElementById("main-garden-display");
    const leftBtn = document.getElementById("garden-nav-left");
    const rightBtn = document.getElementById("garden-nav-right");

    const pages = document.querySelectorAll(".garden-plot-page");
    const pageCount = pages.length;

    mainGardenDisplay.style.transform = `translateX(-${
      currentGardenPage * 100
    }%)`;

    leftBtn.disabled = currentGardenPage === 0;
    rightBtn.disabled = currentGardenPage >= pageCount - 1;
  }

  async function displayShop() {
    await chrome.runtime.sendMessage({ action: "ensureShopIsInitialized" });
    const data = await chrome.storage.local.get([
      "playerGold",
      "dailyShopItems",
      "dailyShopSeeds",
    ]);
    const { playerGold = 0, dailyShopItems = [], dailyShopSeeds = [] } = data;
    document.getElementById("gold-display").querySelector("span").textContent =
      playerGold;
    const itemContainer = document.getElementById("item-shop-container");
    const seedContainer = document.getElementById("seed-shop-container");
    itemContainer.innerHTML = "";
    seedContainer.innerHTML = "";

    const createShopCard = (item, type, index) => {
      const card = document.createElement("div");
      card.className = "shop-item";
      card.innerHTML = `
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-price">${item.cost} 💰</div>
        <button data-id="${
          item.id
        }" data-type="${type}" data-index="${index}" ${
        item.soldOut ? "disabled" : ""
      }>
          ${item.soldOut ? "Sold Out" : "Buy"}
        </button>`;
      card
        .querySelector("button")
        .addEventListener("click", () => purchaseItem(item, type, index));
      return card;
    };

    if (dailyShopItems && dailyShopItems.length > 0) {
      dailyShopItems.forEach((item, index) =>
        itemContainer.appendChild(createShopCard(item, "item", index))
      );
    }
    if (dailyShopSeeds && dailyShopSeeds.length > 0) {
      dailyShopSeeds.forEach((seed, index) =>
        seedContainer.appendChild(createShopCard(seed, "seed", index))
      );
    }
  }

  async function purchaseItem(itemToBuy, type, index) {
    if (isPurchasing) {
      return;
    }
    isPurchasing = true;

    try {
      const data = await chrome.storage.local.get([
        "playerGold",
        "fertilizerInventory",
        "potionInventory",
        "seedInventory",
        "plantInventory",
        "dailyShopItems",
        "dailyShopSeeds",
        "activityLog",
      ]);

      if (data.playerGold < itemToBuy.cost) {
        alert("Not enough gold!");
        return;
      }

      if (type === "seed") {
        const plantCount = Object.keys(data.plantInventory).length;
        if (plantCount >= MAX_GARDEN_SIZE + 1) {
          alert("Your garden and active slot are full!");
          return;
        }
      }

      data.playerGold -= itemToBuy.cost;

      if (type === "item") {
        if (
          itemToBuy.id.includes("sunshine") ||
          itemToBuy.id.includes("aspirin") ||
          itemToBuy.id.includes("stone")
        ) {
          data.potionInventory[itemToBuy.id] =
            (data.potionInventory[itemToBuy.id] || 0) + 1;
        } else {
          data.fertilizerInventory[itemToBuy.id] =
            (data.fertilizerInventory[itemToBuy.id] || 0) + 1;
        }
      } else if (type === "seed") {
        data.seedInventory.push(itemToBuy.id);
      }

      const shopList =
        type === "item" ? data.dailyShopItems : data.dailyShopSeeds;

      const purchasedItem = shopList[index];

      if (purchasedItem && purchasedItem.id === itemToBuy.id) {
        if (purchasedItem.soldOut) {
          return;
        }
        purchasedItem.soldOut = true;
      } else {
        console.error("Shop item mismatch at index! Aborting purchase.");
        return;
      }

      data.activityLog.unshift({
        timestamp: new Date().toISOString(),
        message: `You purchased ${itemToBuy.name}.`,
      });
      if (data.activityLog.length > 30) data.activityLog.pop();

      await chrome.storage.local.set({
        playerGold: data.playerGold,
        fertilizerInventory: data.fertilizerInventory,
        potionInventory: data.potionInventory,
        seedInventory: data.seedInventory,
        dailyShopItems: data.dailyShopItems,
        dailyShopSeeds: data.dailyShopSeeds,
        activityLog: data.activityLog,
      });

      await displayShop();
    } catch (error) {
      console.error("An error occurred during purchase:", error);
    } finally {
      isPurchasing = false;
    }
  }

  // --- CATEGORIZATION PAGE LOGIC ---
  const productiveList = document.getElementById("productive-sites-list");
  const unproductiveList = document.getElementById("unproductive-sites-list");
  const uncategorizedList = document.getElementById("uncategorized-sites-list");
  const addProductiveInput = document.getElementById("add-productive-input");
  const addUnproductiveInput = document.getElementById(
    "add-unproductive-input"
  );
  const addProductiveBtn = document.getElementById("add-productive-btn");
  const addUnproductiveBtn = document.getElementById("add-unproductive-btn");

  function renderLists(productiveSites, unproductiveSites, uncategorizedSites) {
    productiveList.innerHTML = "";
    unproductiveList.innerHTML = "";
    uncategorizedList.innerHTML = "";
    productiveSites.forEach((site) => addSiteToList(site, "productive"));
    unproductiveSites.forEach((site) => addSiteToList(site, "unproductive"));
    uncategorizedSites.forEach((site) => addUncategorizedSiteToList(site));
  }

  function addSiteToList(site, type) {
    const list = type === "productive" ? productiveList : unproductiveList;
    const listItem = document.createElement("li");
    const siteButton = document.createElement("button");
    siteButton.textContent = site;
    siteButton.className = "site-remove-btn";
    siteButton.title = `Click to remove ${site}`;
    siteButton.addEventListener("click", () => removeSite(site, type));
    listItem.appendChild(siteButton);
    list.appendChild(listItem);
  }

  function addUncategorizedSiteToList(site) {
    const listItem = document.createElement("li");
    listItem.className = "uncategorized-item";
    const siteText = document.createElement("span");
    siteText.textContent = site;

    const productiveBtn = document.createElement("button");
    productiveBtn.className = "action-btn productive";
    productiveBtn.title = "Mark as Productive";
    productiveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;
    productiveBtn.addEventListener("click", () => addSite(site, "productive"));

    const unproductiveBtn = document.createElement("button");
    unproductiveBtn.className = "action-btn unproductive";
    unproductiveBtn.title = "Mark as Unproductive";
    unproductiveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
    unproductiveBtn.addEventListener("click", () =>
      addSite(site, "unproductive")
    );

    listItem.appendChild(siteText);
    listItem.appendChild(productiveBtn);
    listItem.appendChild(unproductiveBtn);
    uncategorizedList.appendChild(listItem);
  }

  function addSite(site, type) {
    if (!site) return;
    const key = type === "productive" ? "productiveSites" : "unproductiveSites";
    chrome.storage.local.get([key], (result) => {
      const sites = result[key] || [];
      if (!sites.includes(site)) {
        sites.push(site);
        chrome.storage.local.set({ [key]: sites }, () => {
          initializeCategorizationPage();
        });
      }
    });
  }

  function removeSite(site, type) {
    const key = type === "productive" ? "productiveSites" : "unproductiveSites";
    chrome.storage.local.get([key], (result) => {
      let sites = result[key] || [];
      sites = sites.filter((s) => s !== site);
      chrome.storage.local.set({ [key]: sites }, () => {
        initializeCategorizationPage();
      });
    });
  }

  function initializeCategorizationPage() {
    chrome.storage.local.get(
      ["productiveSites", "unproductiveSites"],
      (localResult) => {
        chrome.storage.session.get(["sessionData"], (sessionResult) => {
          const productiveSites = localResult.productiveSites || [];
          const unproductiveSites = localResult.unproductiveSites || [];
          const sessionData = sessionResult.sessionData || {};
          const sessionSites = Object.keys(sessionData);
          const uncategorizedSites = sessionSites.filter(
            (site) =>
              !productiveSites.includes(site) &&
              !unproductiveSites.includes(site)
          );
          renderLists(productiveSites, unproductiveSites, uncategorizedSites);
        });
      }
    );
  }

  addProductiveInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSite(addProductiveInput.value.trim(), "productive");
      addProductiveInput.value = "";
    }
  });

  addUnproductiveInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSite(addUnproductiveInput.value.trim(), "unproductive");
      addUnproductiveInput.value = "";
    }
  });

  // --- HISTORY PAGE LOGIC ---
  function displayHistory() {
    const calendarContainer = document.getElementById("calendar-container");

    chrome.storage.local.get(["dailyProductivityLog"], (result) => {
      const log = result.dailyProductivityLog || {};
      calendarContainer.innerHTML = "";

      displayLongRunStats(log);

      const sortedDates = Object.keys(log).sort();
      if (sortedDates.length === 0) {
        calendarContainer.innerHTML =
          "<p>No daily history has been recorded yet.</p>";
        return;
      }

      const popups = {};
      for (const date of sortedDates) {
        const dayData = log[date];

        const { totalTime, productiveTime } = dayData;

        let score = 0;
        if (totalTime > 0) {
          score = (productiveTime / totalTime) * 100;
        }

        popups[date] = {
          modifier: "bg-blue-400 text-white",
          html: `Productivity: <b>${score.toFixed(
            0
          )}%</b><br>Total Time: <b>${formatTime(totalTime)}</b>`,
        };
      }

      const localToday = new Date();
      const localTodayStr = `${localToday.getFullYear()}-${String(
        localToday.getMonth() + 1
      ).padStart(2, "0")}-${String(localToday.getDate()).padStart(2, "0")}`;

      const options = {
        settings: {
          range: {
            min: sortedDates[0],
            max: localTodayStr,
          },
          visibility: {
            theme: "light",
            weekNumbers: false,
          },
          selection: {
            day: false,
          },
        },
        popups: popups,
        actions: {
          onRender: (self) => {
            const dayElements = self.HTMLElement.querySelectorAll(
              ".vanilla-calendar-day__btn"
            );
            dayElements.forEach((dayEl) => {
              const dayDate = dayEl.dataset.calendarDay;
              if (log[dayDate]) {
                const { totalTime, productiveTime } = log[dayDate];
                let score = 0;
                if (totalTime > 0) {
                  score = (productiveTime / totalTime) * 100;
                }

                const scoreEl = document.createElement("div");
                scoreEl.className = "productivity-score";
                scoreEl.textContent = `${score.toFixed(0)}%`;
                dayEl.appendChild(scoreEl);
              }
            });
          },
        },
      };

      const calendar = new VanillaCalendar("#calendar-container", options);
      calendar.init();
    });
  }

  function displayLongRunStats(log) {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let stats = {
      today: { productiveTime: 0, totalTime: 0 },
      week: { productiveTime: 0, totalTime: 0 },
      month: { productiveTime: 0, totalTime: 0 },
      allTime: { productiveTime: 0, totalTime: 0 },
    };

    for (const dateStr in log) {
      const entry = log[dateStr];
      const dateParts = dateStr.split("-").map((part) => parseInt(part, 10));
      const entryDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

      stats.allTime.productiveTime += entry.productiveTime;
      stats.allTime.totalTime += entry.totalTime;

      if (
        entryDate.getFullYear() === currentYear &&
        entryDate.getMonth() === currentMonth
      ) {
        stats.month.productiveTime += entry.productiveTime;
        stats.month.totalTime += entry.totalTime;
      }

      if (entryDate >= startOfWeek && entryDate <= today) {
        stats.week.productiveTime += entry.productiveTime;
        stats.week.totalTime += entry.totalTime;
      }

      if (dateStr === todayStr) {
        stats.today.productiveTime = entry.productiveTime;
        stats.today.totalTime = entry.totalTime;
      }
    }

    const formatStatString = (period) => {
      const { productiveTime, totalTime } = stats[period];
      if (totalTime === 0) {
        return "No activity recorded.";
      }
      const score = ((productiveTime / totalTime) * 100).toFixed(0);
      const hours = (totalTime / 3600).toFixed(1);
      return `${score}% productive for ${hours} hours.`;
    };

    document.getElementById("stats-today").textContent =
      formatStatString("today");
    document.getElementById("stats-week").textContent =
      formatStatString("week");
    document.getElementById("stats-month").textContent =
      formatStatString("month");
    document.getElementById("stats-all-time").textContent =
      formatStatString("allTime");
  }

  transferBtn.addEventListener("click", () => {
    chrome.storage.local.set({ currentPlantId: null }, () => {
      console.log("Current plant transferred. Set to null.");
      displayCurrentPlant();
      updatePlantDropdown();
      updateFertilizerDropdown();
      updatePotionDropdown();
    });
  });

  reviveBtn.addEventListener("click", (event) => {
    reviveDropdown.classList.toggle("open");
    seedDropdown.classList.remove("open");
    fertilizerDropdown.classList.remove("open");
    event.stopPropagation();
  });

  sellPlantBtn.addEventListener("click", (event) => {
    document.getElementById("sell-plant-dropdown").classList.toggle("open");
    event.stopPropagation();
  });

  document
    .getElementById("back-to-garden-btn")
    .addEventListener("click", () => {
      const gardenNavButton = document.querySelector(
        'nav .radio[data-page="garden-page"]'
      );
      if (gardenNavButton) gardenNavButton.click();
    });

  document.getElementById("garden-nav-left").addEventListener("click", () => {
    if (currentGardenPage > 0) {
      currentGardenPage--;
      updateGardenDisplay();
    }
  });

  document.getElementById("garden-nav-right").addEventListener("click", () => {
    const pageCount = document.querySelectorAll(".garden-plot-page").length;
    if (currentGardenPage < pageCount - 1) {
      currentGardenPage++;
      updateGardenDisplay();
    }
  });

  document.getElementById("go-to-shop-btn").addEventListener("click", () => {
    const shopNavButton = document.querySelector(
      'nav .radio[data-page="shop-page"]'
    );
    if (shopNavButton) {
      shopNavButton.click();
    }
  });

  plantBtn.addEventListener("click", (event) => {
    seedDropdown.classList.toggle("open");
    fertilizerDropdown.classList.remove("open");
    reviveDropdown.classList.remove("open");
    event.stopPropagation();
  });

  fertilizerBtn.addEventListener("click", (event) => {
    fertilizerDropdown.classList.toggle("open");
    seedDropdown.classList.remove("open");
    reviveDropdown.classList.remove("open");
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (
      !plantBtn.contains(event.target) &&
      !fertilizerBtn.contains(event.target) &&
      !reviveBtn.contains(event.target) &&
      !sellPlantBtn.contains(event.target)
    ) {
      seedDropdown.classList.remove("open");
      fertilizerDropdown.classList.remove("open");
      reviveDropdown.classList.remove("open");
      document.getElementById("sell-plant-dropdown").classList.remove("open");
    }
  });

  const statsPage = document.getElementById("stats-page");
  const historyPage = document.getElementById("history-page");
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const backToStatsBtn = document.getElementById("back-to-stats-btn");
  const resetSessionBtn = document.getElementById("reset-session-btn");
  const waterBtn = document.getElementById("action-water");
  waterBtn.addEventListener("click", waterPlant);

  resetSessionBtn.addEventListener("click", () => {
    chrome.storage.session.set({ sessionData: {} }, () => {
      console.log("Session data has been reset.");
      chrome.runtime.sendMessage({ action: "resetSession" });
      displayStats();
    });
  });

  viewHistoryBtn.addEventListener("click", () => {
    statsPage.classList.remove("active");
    historyPage.classList.add("active");
    displayHistory();
  });
  backToStatsBtn.addEventListener("click", () => {
    historyPage.classList.remove("active");
    statsPage.classList.add("active");
  });

  navItems.forEach((item) => {
    item.addEventListener("click", async () => {
      const targetPageId = item.dataset.page;
      pages.forEach((page) => {
        page.classList.toggle("active", page.id === targetPageId);
      });

      if (targetPageId === "home-page") {
        displayCurrentPlant();
        updatePlantDropdown();
        updateFertilizerDropdown();
        updatePotionDropdown();
        updateWaterLevelDisplay();
        displayActivityLog();
      } else if (targetPageId === "stats-page") {
        displayStats();
      } else if (targetPageId === "categorization-page") {
        initializeCategorizationPage();
      } else if (targetPageId === "garden-page") {
        await updateGardenPage();
      } else if (targetPageId === "shop-page") {
        await displayShop();
      }
    });
  });
  displayCurrentPlant();
  updatePlantDropdown();
  updateFertilizerDropdown();
  updatePotionDropdown();
  updateWaterLevelDisplay();
  displayActivityLog();
});
