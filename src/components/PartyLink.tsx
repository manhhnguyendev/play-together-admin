import { Link } from 'react-router-dom'
import { canOpenDossier, tierOf } from '@/auth/permissions'
import { useAdminStore } from '@/auth/store'

/**
 * A person named in an operations table. The link only appears when the tier
 * reading it can actually open the account dossier, so no page offers a refusal.
 */
export function PartyLink({ id, name }: { id?: string | null; name?: string | null }) {
  const tier = tierOf(useAdminStore((state) => state.user))

  if (!id || !canOpenDossier(tier)) return <>{name ?? '—'}</>

  return <Link to={`/users/${id}`}>{name ?? 'Tài khoản đã xoá'}</Link>
}
