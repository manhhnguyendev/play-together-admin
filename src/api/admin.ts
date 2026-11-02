import {
  adminControllerAdjustBehavior,
  adminControllerBroadcast,
  adminControllerFeedback,
  adminControllerMaintenance,
  adminControllerOverview,
  adminControllerResolveFeedback,
  adminControllerResolveWithdrawal,
  adminControllerUpdateUser,
  adminControllerUsers,
  adminControllerWithdrawals,
  charityAdminControllerCreate,
  charityAdminControllerList,
  charityAdminControllerResolve,
  charityAdminControllerUpdate,
  charityAdminControllerWithdrawals,
  ratingsAdminControllerFlagged,
  ratingsAdminControllerResolve,
  reportsAdminControllerList,
  reportsAdminControllerResolve,
} from './generated/endpoints/admin/admin'
import {
  catalogAdminControllerCreateGame,
  catalogAdminControllerCreateGameType,
  catalogAdminControllerCreateRank,
  catalogAdminControllerRemoveGame,
  catalogAdminControllerRemoveGameType,
  catalogAdminControllerRemoveRank,
  catalogAdminControllerUpdateGame,
  catalogAdminControllerUpdateGameType,
  catalogAdminControllerUpdateRank,
} from './generated/endpoints/admin-catalog/admin-catalog'
import {
  systemConfigAdminControllerCreate,
  systemConfigAdminControllerList,
  systemConfigAdminControllerRemove,
  systemConfigAdminControllerUpdate,
} from './generated/endpoints/admin-configs/admin-configs'
import {
  adminOpsControllerAuditLogs,
  adminOpsControllerDeposits,
  adminOpsControllerEscrows,
  adminOpsControllerKpis,
  adminOpsControllerLedger,
  adminOpsControllerOrderDetail,
  adminOpsControllerOrders,
  adminOpsControllerUserDossier,
  adminOpsControllerWallets,
} from './generated/endpoints/admin-ops/admin-ops'
import { authControllerLogin, authControllerLogout } from './generated/endpoints/auth/auth'
import {
  catalogControllerGetGame,
  catalogControllerListGames,
  catalogControllerListGameTypes,
} from './generated/endpoints/catalog/catalog'
import { systemConfigControllerPublicConfigs } from './generated/endpoints/configs/configs'

export type {
  AdminControllerFeedbackParams as ListFeedbackParams,
  AdminControllerUsersParams as ListUsersParams,
  ReportsAdminControllerListParams as ListReportsParams,
  ResolveReportDto as ResolveReportBody,
} from './generated/models'

export const authService = {
  login: (email: string, password: string) => authControllerLogin({ email, password }),
  logout: (refreshToken: string) => authControllerLogout({ refreshToken }),
}

export const adminService = {
  stats: adminControllerOverview,

  users: adminControllerUsers,
  updateUser: adminControllerUpdateUser,
  adjustBehavior: adminControllerAdjustBehavior,

  feedback: adminControllerFeedback,
  resolveFeedback: adminControllerResolveFeedback,

  reports: reportsAdminControllerList,
  resolveReport: reportsAdminControllerResolve,

  flaggedRatings: ratingsAdminControllerFlagged,
  resolveViolation: ratingsAdminControllerResolve,

  withdrawals: adminControllerWithdrawals,
  resolveWithdrawal: adminControllerResolveWithdrawal,

  charityWithdrawals: charityAdminControllerWithdrawals,
  resolveCharityWithdrawal: charityAdminControllerResolve,

  charities: charityAdminControllerList,
  createCharity: charityAdminControllerCreate,
  updateCharity: charityAdminControllerUpdate,

  broadcast: adminControllerBroadcast,
  maintenance: adminControllerMaintenance,

  configs: systemConfigAdminControllerList,
  createConfig: systemConfigAdminControllerCreate,
  updateConfig: systemConfigAdminControllerUpdate,
  deleteConfig: systemConfigAdminControllerRemove,
}

export const catalogService = {
  games: catalogControllerListGames,
  game: catalogControllerGetGame,
  createGame: catalogAdminControllerCreateGame,
  updateGame: catalogAdminControllerUpdateGame,
  deleteGame: catalogAdminControllerRemoveGame,

  createRank: catalogAdminControllerCreateRank,
  updateRank: catalogAdminControllerUpdateRank,
  deleteRank: catalogAdminControllerRemoveRank,

  gameTypes: catalogControllerListGameTypes,
  createGameType: catalogAdminControllerCreateGameType,
  updateGameType: catalogAdminControllerUpdateGameType,
  deleteGameType: catalogAdminControllerRemoveGameType,
}

export const configService = {
  public: systemConfigControllerPublicConfigs,
}

/**
 * Read side of the console. The tiers here are the ones the API enforces, so a
 * page built on this service can never offer an action the token would reject.
 */
export const opsService = {
  auditLogs: adminOpsControllerAuditLogs,
  orders: adminOpsControllerOrders,
  order: adminOpsControllerOrderDetail,
  user: adminOpsControllerUserDossier,
  kpis: adminOpsControllerKpis,
  ledger: adminOpsControllerLedger,
  wallets: adminOpsControllerWallets,
  deposits: adminOpsControllerDeposits,
  escrows: adminOpsControllerEscrows,
}
