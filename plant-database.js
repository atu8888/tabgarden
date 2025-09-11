const PLANT_DATABASE = {
  rose: {
    id: "rose",
    name: "Mystic Rose",
    description:
      "A bloom born from twilight's deep embrace, its velvet petals hold the soft glow of starlight. ",
    cost: 100,
    sellValue: 200,
    rarity: "common",
    growthStages: [
      { threshold: 0, staticFrame: 1 },
      { threshold: 20, staticFrame: 10 },
      { threshold: 40, staticFrame: 20 },
      { threshold: 60, staticFrame: 30 },
      { threshold: 80, staticFrame: 40 },
      { threshold: 100, staticFrame: 50 },
    ],
    animationData: {
      sprite: "images/rose/rose_animation_50.png",
      totalFrames: 50,
    },
    transitions: {
      20: { startFrame: 1, endFrame: 10, duration: "1s" },
      40: { startFrame: 11, endFrame: 20, duration: "1s" },
      60: { startFrame: 21, endFrame: 30, duration: "1s" },
      80: { startFrame: 31, endFrame: 40, duration: "1s" },
      100: { startFrame: 41, endFrame: 50, duration: "1.5s" },
    },
    rules: {
      growthRate: 1,
      growthThreshold: 0,
      resilience: 1,
    },
  },

  sunflower: {
    id: "sunflower",
    name: "Sunstone Sunflower",
    description:
      "A brilliant beacon of captured daylight, the Sunstone Sunflower radiates with the warmth of a productive day.",
    cost: 100,
    sellValue: 200,
    rarity: "common",
    growthStages: [
      { threshold: 0, staticFrame: 1 },
      { threshold: 20, staticFrame: 10 },
      { threshold: 40, staticFrame: 20 },
      { threshold: 60, staticFrame: 30 },
      { threshold: 80, staticFrame: 40 },
      { threshold: 100, staticFrame: 50 },
    ],
    animationData: {
      sprite: "images/sunflower/sunflower_animation_50.png",
      totalFrames: 50,
    },
    transitions: {
      20: { startFrame: 1, endFrame: 10, duration: "1s" },
      40: { startFrame: 11, endFrame: 20, duration: "1s" },
      60: { startFrame: 21, endFrame: 30, duration: "1s" },
      80: { startFrame: 31, endFrame: 40, duration: "1s" },
      100: { startFrame: 41, endFrame: 50, duration: "1.5s" },
    },
    rules: {
      growthRate: 1.2,
      growthThreshold: 0,
      resilience: 1,
    },
  },
};
