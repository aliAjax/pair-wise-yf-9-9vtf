// 记忆速览 · 复习队列状态
// 纯状态逻辑：不读写 DOM，也不直接碰 localStorage，方便单独理解和测试。
const ReviewQueue = {
  // 四类提醒的固定顺序，生成复习卡时按原顺序拼接
  categories: [
    { key: "forgets", label: "容易忘的规则" },
    { key: "disputes", label: "常见争议" },
    { key: "setup", label: "开局准备" },
    { key: "scoring", label: "计分提醒" }
  ],

  // 生成复习卡：四类提醒按原顺序，重复出现的提醒各算一张
  buildCards(game) {
    const cards = [];
    this.categories.forEach(({ key, label }) => {
      (game[key] || []).forEach((text, index) => {
        cards.push({
          id: `${key}-${index}`,
          typeLabel: label,
          index: index + 1,
          text,
          firstResult: "" // 只按第一次选择计入正确率
        });
      });
    });
    return cards;
  },

  createSession(game) {
    const cards = this.buildCards(game);
    return {
      gameId: game.id,
      cards,
      queue: cards.map((card) => card.id),
      revealed: false, // 当前卡是否已揭示原文
      lastChoice: "" // 当前卡本次的选择（记得 / 忘了）
    };
  },

  currentCard(session) {
    return session.cards.find((card) => card.id === session.queue[0]) || null;
  },

  // 选择“记得 / 忘了”：只记录第一次选择，然后揭示原文
  answer(session, choice) {
    const card = this.currentCard(session);
    if (!card || session.revealed) return;
    session.lastWasRepeat = Boolean(card.firstResult); // 本次作答前是否已出现过
    if (!card.firstResult) card.firstResult = choice;
    session.lastChoice = choice;
    session.revealed = true;
  },

  // 进入下一张：记得的移走，忘了的隔两张再出现
  advance(session) {
    if (!session.revealed) return;
    const id = session.queue.shift();
    if (session.lastChoice === "forgotten") {
      const insertAt = Math.min(2, session.queue.length);
      session.queue.splice(insertAt, 0, id);
    }
    session.revealed = false;
    session.lastChoice = "";
  },

  isFinished(session) {
    return session.queue.length === 0;
  },

  // 结算：每张卡只按第一次选择计入正确率，重复提醒各算一张
  summarize(session) {
    const total = session.cards.length;
    const remembered = session.cards.filter((card) => card.firstResult === "remembered").length;
    return {
      date: new Date().toISOString().slice(0, 10),
      total,
      remembered,
      accuracy: total ? Math.round((remembered / total) * 100) : 0
    };
  }
};
