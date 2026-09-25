// 记忆速览 · 旧数据兼容
// 负责把旧版本存档补全成当前结构，队列状态和页面展示都不用关心字段缺失。
const StorageCompat = {
  migrate(saved, fallback) {
    const base = { ...structuredClone(fallback), ...(saved && typeof saved === "object" ? saved : {}) };
    base.games = (Array.isArray(base.games) ? base.games : []).map((game) => this.migrateGame(game));
    base.reviewSessions = this.migrateSessions(base.reviewSessions, base.games);
    return base;
  },

  migrateGame(game) {
    const safe = game && typeof game === "object" ? game : {};
    return {
      ...safe,
      forgets: Array.isArray(safe.forgets) ? safe.forgets : [],
      disputes: Array.isArray(safe.disputes) ? safe.disputes : [],
      setup: Array.isArray(safe.setup) ? safe.setup : [],
      scoring: Array.isArray(safe.scoring) ? safe.scoring : [],
      // 旧收藏没有复习记录：留空数组，页面按首次复习处理
      reviews: Array.isArray(safe.reviews) ? safe.reviews : []
    };
  },

  // 只保留还存在的桌游、且结构完整的未完成队列
  migrateSessions(sessions, games) {
    const ids = new Set(games.map((game) => game.id));
    const result = {};
    Object.entries(sessions && typeof sessions === "object" ? sessions : {}).forEach(([gameId, session]) => {
      const valid =
        session && Array.isArray(session.cards) && Array.isArray(session.queue) && session.queue.length > 0;
      if (ids.has(gameId) && valid) result[gameId] = session;
    });
    return result;
  }
};
