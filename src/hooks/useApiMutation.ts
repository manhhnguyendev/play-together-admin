import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { App } from 'antd'
import { toApiError } from '@/api/client'

interface ApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string | ((data: TData, variables: TVariables) => string)
  invalidate?: readonly QueryKey[]
  onSuccess?: (data: TData, variables: TVariables) => void
}

export function useApiMutation<TData, TVariables>({
  mutationFn,
  successMessage,
  invalidate = [],
  onSuccess,
}: ApiMutationOptions<TData, TVariables>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (successMessage) {
        message.success(
          typeof successMessage === 'function' ? successMessage(data, variables) : successMessage,
        )
      }
      for (const queryKey of invalidate) void queryClient.invalidateQueries({ queryKey })
      onSuccess?.(data, variables)
    },
    onError: (error) => message.error(toApiError(error).message),
  })
}
