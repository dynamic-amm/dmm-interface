import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { updateProcessingLogin, updateProfile } from 'state/authen/actions'
import { AuthenState, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

export function useSessionInfo(): AuthenState {
  const { account } = useActiveWeb3React()
  const authen = useSelector((state: AppState) => state.authen)
  const isLogin = Boolean(authen.isLogin && account)
  return { ...authen, isLogin }
}

export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    ({ profile, isAnonymous = false }: { profile: UserProfile | undefined; isAnonymous?: boolean }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
    },
    [dispatch],
  )
}

export const useSetPendingAuthentication = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: boolean) => {
      dispatch(updateProcessingLogin(value))
    },
    [dispatch],
  )
}
