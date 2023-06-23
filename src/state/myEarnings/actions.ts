import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { VERSION } from 'constants/v2'

export const selectChains = createAction<ChainId[]>('myEarnings/selectChains')
export const toggleShowClosedPositions = createAction('myEarnings/toggleShowClosedPositions')
export const showEarningView = createAction('myEarnings/showEarningView')
export const showPositionView = createAction('myEarnings/showPositionView')

export const setSearchText = createAction<string>('myEarnings/setSearchText')
export const expandAllPools = createAction('myEarnings/expandAllPools')
export const collapseAllPools = createAction('myEarnings/collapseAllPools')
export const setActiveTab = createAction<VERSION>('myEarnings/setActiveTab')
export const setCollectFeeError = createAction<string>('myEarnings/setCollectFeeError')
export const setAttemptingTxn = createAction<boolean>('myEarnings/setAttemptingTxn')
export const setTxnHash = createAction<string>('myEarnings/setTxnHash')
export const setShowPendingModal = createAction<boolean>('myEarnings/setShowPendingModal')
