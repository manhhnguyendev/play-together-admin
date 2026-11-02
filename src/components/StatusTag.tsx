import { Tag } from 'antd'
import { statusMeta, type StatusDomain } from '@/lib/labels'

export function StatusTag({ status, domain }: { status: string; domain?: StatusDomain }) {
  const meta = statusMeta(status, domain)
  return <Tag color={meta.color}>{meta.label}</Tag>
}
