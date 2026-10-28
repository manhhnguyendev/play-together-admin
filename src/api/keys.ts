export const adminKeys = {
  stats: ['admin', 'stats'],
  users: ['admin', 'users'],
  feedback: ['admin', 'feedback'],
  reports: ['admin', 'reports'],
  flaggedRatings: ['admin', 'flagged-ratings'],
  withdrawals: ['admin', 'withdrawals'],
  charityWithdrawals: ['admin', 'charity-withdrawals'],
  charities: ['admin', 'charities'],
  configs: ['admin', 'configs'],
} as const

export const catalogKeys = {
  games: ['catalog', 'games'],
  game: (gameId: string) => ['catalog', 'game', gameId],
  gameTypes: ['catalog', 'game-types'],
  gameTypeOptions: ['catalog', 'game-types', 'options'],
} as const

export const publicConfigKey = ['config', 'public'] as const
