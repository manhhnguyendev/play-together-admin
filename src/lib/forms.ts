export const trimOrUndefined = (value?: string | null): string | undefined => {
  const next = value?.trim()
  return next ? next : undefined
}
