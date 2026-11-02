import { create } from 'zustand'
import { adminService, authService, opsService } from '@/api/admin'
import { ApiError, getSessionTokens, setSessionTokens, setUnauthorizedHandler } from '@/api/client'
import type { UserSummary } from '@/api/types'

const USER_KEY = 'pt_admin_user'

type AdminStatus = 'loading' | 'signedOut' | 'signedIn'

interface AdminState {
  status: AdminStatus
  user: UserSummary | null
  error: string | null
  bootstrap: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: (options?: { callApi?: boolean }) => Promise<void>
}

function readStoredUser(): UserSummary | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserSummary
  } catch {
    return null
  }
}

function storeUser(user: UserSummary | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

let bootstrapped = false

const FORBIDDEN_MESSAGE = 'Tài khoản này không có quyền quản trị'

/**
 * The tier is re-read on every boot instead of trusting what is in storage: an
 * account saved before the split, or re-tiered while the tab was closed, must
 * not keep opening pages the API has since stopped answering. Reading your own
 * dossier needs a tier, so a refusal is the answer that there is none.
 */
async function refreshAccount(stored: UserSummary | null): Promise<UserSummary | null> {
  if (!stored?.id) return null
  try {
    const dossier = await opsService.user(stored.id)
    return dossier.account
  } catch {
    return { ...stored, adminRole: null }
  }
}

export const useAdminStore = create<AdminState>((set) => ({
  status: 'loading',
  user: readStoredUser(),
  error: null,

  bootstrap: async () => {
    if (bootstrapped) return
    bootstrapped = true

    if (!getSessionTokens()) {
      storeUser(null)
      set({ status: 'signedOut', user: null })
      return
    }

    try {
      await adminService.stats()
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0
      setSessionTokens(null)
      storeUser(null)
      set({
        status: 'signedOut',
        user: null,
        error: status === 403 ? FORBIDDEN_MESSAGE : null,
      })
      return
    }

    const account = await refreshAccount(readStoredUser())
    storeUser(account)
    set({ status: 'signedIn', user: account })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const auth = await authService.login(email, password)
    setSessionTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken })

    try {
      await adminService.stats()
    } catch (error) {
      setSessionTokens(null)
      if (error instanceof ApiError && error.status === 403) {
        set({ error: FORBIDDEN_MESSAGE })
        throw new Error(FORBIDDEN_MESSAGE)
      }
      throw error
    }

    storeUser(auth.user)
    set({ status: 'signedIn', user: auth.user })
  },

  signOut: async (options) => {
    const tokens = getSessionTokens()
    if (options?.callApi !== false && tokens) {
      await authService.logout(tokens.refreshToken).catch(() => undefined)
    }
    setSessionTokens(null)
    storeUser(null)
    set({ status: 'signedOut', user: null })
  },
}))

setUnauthorizedHandler(() => {
  void useAdminStore.getState().signOut({ callApi: false })
})
