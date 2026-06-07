import mongoose from "mongoose";

const { Schema } = mongoose;

const SystemSchema = new Schema(
  {
    todayTip: {
      type: String,
      default: "",
    },
    gurmatSangeetTips: {
      type: [String],
      default: [],
    },
    lastTipUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SystemSchema.statics.getTodayTip = async function () {
  let system = await this.findOne();
  const now = new Date();

  const defaultTips = [
    "ਅੱਜ ਰਿਆਜ਼ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਘੱਟੋ-ਘੱਟ 5 ਮਿੰਟ ਲੰਮੇ ਸਾਹਾਂ ਦੀ ਕਸਰਤ ਕਰੋ।",
    "ਹਰ ਸ਼ਬਦ ਦੀ ਉਚਾਰਣ ਸਾਫ਼ ਅਤੇ ਸਪਸ਼ਟ ਰੱਖੋ।",
    "ਰਾਗ ਦੀ ਮਰਯਾਦਾ ਨੂੰ ਸਮਝ ਕੇ ਗਾਇਨ ਕਰੋ।",
    "ਰਿਆਜ਼ ਦੌਰਾਨ ਲਯ ਅਤੇ ਤਾਲ 'ਤੇ ਖ਼ਾਸ ਧਿਆਨ ਦਿਓ।",
    "ਹੌਲੀ ਗਤੀ ਨਾਲ ਸ਼ੁਰੂ ਕਰਕੇ ਧੀਰੇ-ਧੀਰੇ ਗਤੀ ਵਧਾਓ।",
    "ਰੋਜ਼ਾਨਾ ਨਿਯਮਿਤ ਰਿਆਜ਼ ਕਰਨ ਨਾਲ ਸੁਰ ਮਜ਼ਬੂਤ ਹੁੰਦੇ ਹਨ।",
    "ਗੁਰਬਾਣੀ ਦੇ ਅਰਥ ਸਮਝ ਕੇ ਕੀਰਤਨ ਕਰਨ ਨਾਲ ਭਾਵਨਾ ਹੋਰ ਗਹਿਰੀ ਬਣਦੀ ਹੈ।",
    "ਤਾਨਪੁਰੇ ਜਾਂ ਸੁਰ ਪੇਟੀ ਨਾਲ ਸੁਰ ਮਿਲਾ ਕੇ ਰਿਆਜ਼ ਕਰੋ।",
    "ਰਿਆਜ਼ ਲਈ ਸ਼ਾਂਤ ਅਤੇ ਧਿਆਨਯੋਗ ਮਾਹੌਲ ਚੁਣੋ।",
    "ਹਰ ਰੋਜ਼ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਨਵਾਂ ਸ਼ਬਦ ਜਾਂ ਬੰਦ ਯਾਦ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    "ਉੱਚੇ ਸੁਰਾਂ ਦੀ ਬਜਾਏ ਸਹੀ ਸੁਰਾਂ 'ਤੇ ਧਿਆਨ ਦਿਓ।",
    "ਕੀਰਤਨ ਦੌਰਾਨ ਮਨ ਨੂੰ ਇਕਾਗਰ ਰੱਖਣਾ ਵੀ ਰਿਆਜ਼ ਦਾ ਹਿੱਸਾ ਹੈ।",
    "ਆਪਣੀ ਆਵਾਜ਼ ਨੂੰ ਜ਼ੋਰ ਨਾਲ ਨਾ ਖਿੱਚੋ, ਕੁਦਰਤੀ ਢੰਗ ਨਾਲ ਗਾਓ।",
    "ਪੁਰਾਤਨ ਗੁਰਮਤਿ ਸੰਗੀਤ ਦੇ ਰਾਗੀਆਂ ਨੂੰ ਸੁਣਨਾ ਵੀ ਇੱਕ ਵਧੀਆ ਅਭਿਆਸ ਹੈ।",
    "ਤਾਲ ਦੀ ਗਿਣਤੀ ਮਨ ਵਿੱਚ ਰੱਖ ਕੇ ਗਾਇਨ ਕਰੋ।",
    "ਹਰ ਰਾਗ ਦੀ ਵਿਸ਼ੇਸ਼ਤਾ ਨੂੰ ਜਾਣਨ ਲਈ ਉਸ ਦਾ ਅਧਿਐਨ ਕਰੋ।",
    "ਸਵੇਰ ਦਾ ਰਿਆਜ਼ ਸੁਰਾਂ ਦੀ ਸ਼ੁੱਧਤਾ ਲਈ ਬਹੁਤ ਲਾਭਕਾਰੀ ਹੁੰਦਾ ਹੈ।",
    "ਰਿਆਜ਼ ਤੋਂ ਪਹਿਲਾਂ ਅਤੇ ਬਾਅਦ ਪਾਣੀ ਪੀਣਾ ਆਵਾਜ਼ ਲਈ ਲਾਭਦਾਇਕ ਹੈ।",
    "ਗੁਰਬਾਣੀ ਗਾਇਨ ਵਿੱਚ ਨਿਮਰਤਾ ਅਤੇ ਭਾਵਨਾ ਸਭ ਤੋਂ ਵੱਡੀ ਸੁੰਦਰਤਾ ਹੈ।",
    "ਅੱਜ ਆਪਣੇ ਰਿਆਜ਼ ਦੀ ਰਿਕਾਰਡਿੰਗ ਸੁਣੋ ਅਤੇ ਸੁਧਾਰ ਦੇ ਬਿੰਦੂ ਨੋਟ ਕਰੋ।",
    "ਸੁਰ ਅਤੇ ਸ਼ਬਦ ਦੋਵੇਂ ਇਕਸਾਰ ਮਹੱਤਵ ਰੱਖਦੇ ਹਨ।",
    "ਹਰ ਦਿਨ ਕੁਝ ਸਮਾਂ ਕੇਵਲ ਸੁਰ ਸਾਧਨਾ ਲਈ ਰੱਖੋ।",
    "ਜਲਦੀ ਸਿੱਖਣ ਦੀ ਬਜਾਏ ਸਹੀ ਸਿੱਖਣ ਨੂੰ ਤਰਜੀਹ ਦਿਓ।",
    "ਗੁਰੂ ਸਾਹਿਬ ਦੀ ਬਾਣੀ ਨੂੰ ਪੂਰੇ ਆਦਰ ਨਾਲ ਗਾਓ।",
    "ਰਿਆਜ਼ ਵਿੱਚ ਲਗਾਤਾਰਤਾ ਹੀ ਸਭ ਤੋਂ ਵੱਡੀ ਕੁੰਜੀ ਹੈ।",
    "ਅੱਜ ਇੱਕੋ ਸ਼ਬਦ ਨੂੰ ਵੱਖ-ਵੱਖ ਲਯਾਂ ਵਿੱਚ ਗਾਉਣ ਦਾ ਅਭਿਆਸ ਕਰੋ।",
    "ਰਾਗ ਅਤੇ ਭਾਵਨਾ ਦਾ ਮੇਲ ਕੀਰਤਨ ਨੂੰ ਹੋਰ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਬਣਾਉਂਦਾ ਹੈ।",
    "ਧੀਰਜ ਨਾਲ ਕੀਤਾ ਰਿਆਜ਼ ਹੀ ਸਥਾਈ ਪ੍ਰਗਤੀ ਲਿਆਉਂਦਾ ਹੈ।",
    "ਹਰ ਸੁਰ ਨੂੰ ਪੂਰੀ ਸਾਵਧਾਨੀ ਨਾਲ ਸੁਣ ਕੇ ਗਾਓ।",
    "ਅੱਜ ਆਪਣੇ ਰਿਆਜ਼ ਦੀ ਸ਼ੁਰੂਆਤ 'ਵਾਹਿਗੁਰੂ' ਦੇ ਸਿਮਰਨ ਨਾਲ ਕਰੋ।"
  ];

  if (!system) {
    // If not seeded, initialize it
    system = new this({
      gurmatSangeetTips: defaultTips,
      lastTipUpdatedAt: now
    });
    if (defaultTips.length > 0) {
      const randIdx = Math.floor(Math.random() * defaultTips.length);
      system.todayTip = defaultTips[randIdx];
    }
    await system.save();
    return system.todayTip;
  }

  // Check if day changed (in local date)
  const lastUpdate = new Date(system.lastTipUpdatedAt || 0);
  const isDifferentDay =
    now.getFullYear() !== lastUpdate.getFullYear() ||
    now.getMonth() !== lastUpdate.getMonth() ||
    now.getDate() !== lastUpdate.getDate();

  if (isDifferentDay || !system.todayTip) {
    const tips = system.gurmatSangeetTips.length > 0 ? system.gurmatSangeetTips : defaultTips;
    if (tips.length > 0) {
      let nextIndex = 0;
      if (tips.length > 1) {
        const currentIndex = tips.indexOf(system.todayTip);
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * tips.length);
        } while (randomIndex === currentIndex);
        nextIndex = randomIndex;
      }
      system.todayTip = tips[nextIndex];
    }
    system.lastTipUpdatedAt = now;
    // Ensure gurmatSangeetTips is populated if empty
    if (system.gurmatSangeetTips.length === 0) {
      system.gurmatSangeetTips = defaultTips;
    }
    await system.save();
  }

  return system.todayTip;
};

const SystemModel = mongoose.model("System", SystemSchema);
export default SystemModel;
