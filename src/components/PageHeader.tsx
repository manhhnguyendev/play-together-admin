import { Typography } from 'antd'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  extra,
}: {
  title: string
  description?: string
  extra?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
      <div style={{ flex: 1 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Text type="secondary">{description}</Typography.Text>
        ) : null}
      </div>
      {extra}
    </div>
  )
}
