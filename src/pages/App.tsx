import { datadogRum } from '@datadog/browser-rum'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import ModalConfirm from 'components/ConfirmModal'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import ProtectedRoute, { ProtectedRouteKyberAI } from 'components/ProtectedRoute'
import Snowfall from 'components/Snowflake/Snowfall'
import Web3ReactManager from 'components/Web3ReactManager'
import { ENV_LEVEL } from 'constants/env'
import { APP_PATHS, BLACKLIST_WALLETS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { ENV_TYPE } from 'constants/type'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useSessionExpiredGlobal from 'hooks/useSessionExpire'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import { useHolidayMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { getLimitOrderContract, isAddressString, shortenAddress } from 'utils'

import { RedirectDuplicateTokenIds } from './AddLiquidityV2/redirects'
import ElasticLegacyNotice from './ElasticLegacy/ElasticLegacyNotice'
import { RedirectPathToFarmNetwork } from './Farm/redirect'
import Icons from './Icons'
import { RedirectPathToMyPoolsNetwork } from './Pool/redirect'
import { RedirectPathToPoolsNetwork } from './Pools/redirect'
import { RedirectPathToSwapV3Network } from './SwapV3/redirects'
import KyberAIExplore from './TrueSightV2'
import TruesightFooter from './TrueSightV2/components/TruesightFooter'
import KyberAILandingPage from './TrueSightV2/pages/LandingPage'
import Verify from './Verify'

// test page for swap only through elastic
const ElasticSwap = lazy(() => import('./ElasticSwap'))
const SwapV2 = lazy(() => import('./SwapV2'))
const SwapV3 = lazy(() => import('./SwapV3'))
const Bridge = lazy(() => import('./Bridge'))
const Pools = lazy(() => import('./Pools'))
const Pool = lazy(() => import('./Pool'))

const Farm = lazy(() => import('./Farm'))

const PoolFinder = lazy(() => import('./PoolFinder'))
const CreatePool = lazy(() => import('./CreatePool'))
const ProAmmRemoveLiquidity = lazy(() => import('./RemoveLiquidityProAmm'))
const RedirectCreatePoolDuplicateTokenIds = lazy(() => import('./CreatePool/RedirectDuplicateTokenIds'))
const RedirectOldCreatePoolPathStructure = lazy(() => import('./CreatePool/RedirectOldCreatePoolPathStructure'))

const AddLiquidity = lazy(() => import('./AddLiquidity'))
const IncreaseLiquidity = lazy(() => import('./IncreaseLiquidity'))

const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import('./KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import('./KyberDAO/Vote'))
const AboutKyberSwap = lazy(() => import('./About/AboutKyberSwap'))
const AboutKNC = lazy(() => import('./About/AboutKNC'))

const BuyCrypto = lazy(() => import('./BuyCrypto'))

const Campaign = lazy(() => import('./Campaign'))
const GrantProgramPage = lazy(() => import('./GrantProgram'))
const NotificationCenter = lazy(() => import('./NotificationCenter'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  z-index: 3;
`

const BodyWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  align-items: center;
  min-height: calc(100vh - 148px);
  flex: 1;
  z-index: 1;
`

const preloadImages = () => {
  const imageList: (string | null)[] = [
    ...Object.values(NETWORKS_INFO_CONFIG).map(network => network.icon),
    ...Object.values(NETWORKS_INFO_CONFIG)
      .map(network => network.iconDark)
      .filter(Boolean),
  ]
  imageList.forEach(image => {
    if (image) {
      new Image().src = image
    }
  })
}

const SwapPage = () => {
  const { chainId } = useActiveWeb3React()
  useSyncNetworkParamWithStore()
  return <ProtectedRoute>{chainId === ChainId.SOLANA ? <SwapV2 /> : <SwapV3 />}</ProtectedRoute>
}

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { pathname } = useLocation()

  useLogin()
  const { online } = useNetwork()
  const prevOnline = usePrevious(online)

  useSessionExpiredGlobal()

  useEffect(() => {
    if (prevOnline === false && online && account) {
      // refresh page when network back to normal to prevent some issues: ex: stale data, ...
      window.location.reload()
    }
  }, [online, prevOnline, account])

  useEffect(() => {
    preloadImages()
  }, [])

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
      datadogRum.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setTags({
        chainId: chainId,
        network: networkInfo.name,
      })
      datadogRum.setGlobalContext({
        chainId,
        networkName: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  const theme = useTheme()

  useGlobalMixpanelEvents()

  const showFooter = !pathname.includes(APP_PATHS.ABOUT)
  const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  // const c = useContract('0x179A3d2e958D185F47D1Db046b796C5242d68981', [
  //   {
  //     inputs: [
  //       { internalType: 'contract IERC721', name: '_nft', type: 'address' },
  //       { internalType: 'address', name: '_helper', type: 'address' },
  //     ],
  //     stateMutability: 'nonpayable',
  //     type: 'constructor',
  //   },
  //   { inputs: [], name: 'EmergencyEnabled', type: 'error' },
  //   { inputs: [], name: 'FailToAdd', type: 'error' },
  //   { inputs: [], name: 'FailToRemove', type: 'error' },
  //   { inputs: [], name: 'FarmNotFound', type: 'error' },
  //   { inputs: [], name: 'Forbidden', type: 'error' },
  //   { inputs: [], name: 'InvalidFarm', type: 'error' },
  //   { inputs: [], name: 'InvalidInput', type: 'error' },
  //   { inputs: [], name: 'InvalidRange', type: 'error' },
  //   { inputs: [], name: 'InvalidReward', type: 'error' },
  //   { inputs: [], name: 'InvalidTime', type: 'error' },
  //   { inputs: [], name: 'NotOwner', type: 'error' },
  //   { inputs: [], name: 'PhaseSettled', type: 'error' },
  //   { inputs: [], name: 'PositionNotEligible', type: 'error' },
  //   { inputs: [], name: 'RangeNotFound', type: 'error' },
  //   { inputs: [], name: 'RangeNotMatch', type: 'error' },
  //   { inputs: [], name: 'StakeNotFound', type: 'error' },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'address', name: 'poolAddress', type: 'address' },
  //       {
  //         components: [
  //           { internalType: 'int24', name: 'tickLower', type: 'int24' },
  //           { internalType: 'int24', name: 'tickUpper', type: 'int24' },
  //           { internalType: 'uint32', name: 'weight', type: 'uint32' },
  //         ],
  //         indexed: false,
  //         internalType: 'struct IKSElasticLMV2.RangeInput[]',
  //         name: 'ranges',
  //         type: 'tuple[]',
  //       },
  //       {
  //         components: [
  //           { internalType: 'uint32', name: 'startTime', type: 'uint32' },
  //           { internalType: 'uint32', name: 'endTime', type: 'uint32' },
  //           {
  //             components: [
  //               { internalType: 'address', name: 'rewardToken', type: 'address' },
  //               { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
  //             ],
  //             internalType: 'struct IKSElasticLMV2.RewardInput[]',
  //             name: 'rewards',
  //             type: 'tuple[]',
  //           },
  //         ],
  //         indexed: false,
  //         internalType: 'struct IKSElasticLMV2.PhaseInput',
  //         name: 'phase',
  //         type: 'tuple',
  //       },
  //       { indexed: false, internalType: 'address', name: 'farmingToken', type: 'address' },
  //     ],
  //     name: 'AddFarm',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       {
  //         components: [
  //           { internalType: 'uint32', name: 'startTime', type: 'uint32' },
  //           { internalType: 'uint32', name: 'endTime', type: 'uint32' },
  //           {
  //             components: [
  //               { internalType: 'address', name: 'rewardToken', type: 'address' },
  //               { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
  //             ],
  //             internalType: 'struct IKSElasticLMV2.RewardInput[]',
  //             name: 'rewards',
  //             type: 'tuple[]',
  //           },
  //         ],
  //         indexed: false,
  //         internalType: 'struct IKSElasticLMV2.PhaseInput',
  //         name: 'phase',
  //         type: 'tuple',
  //       },
  //     ],
  //     name: 'AddPhase',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       {
  //         components: [
  //           { internalType: 'int24', name: 'tickLower', type: 'int24' },
  //           { internalType: 'int24', name: 'tickUpper', type: 'int24' },
  //           { internalType: 'uint32', name: 'weight', type: 'uint32' },
  //         ],
  //         indexed: false,
  //         internalType: 'struct IKSElasticLMV2.RangeInput',
  //         name: 'range',
  //         type: 'tuple',
  //       },
  //     ],
  //     name: 'AddRange',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //       { indexed: false, internalType: 'address', name: 'token', type: 'address' },
  //       { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
  //       { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'ClaimReward',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //       { indexed: true, internalType: 'address', name: 'depositer', type: 'address' },
  //       { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'Deposit',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'duration', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256[]', name: 'rewardAmounts', type: 'uint256[]' },
  //     ],
  //     name: 'ExpandEndTimeAndRewards',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [{ indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' }],
  //     name: 'ForceClosePhase',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //     ],
  //     name: 'RemoveRange',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'address', name: 'oldAdmin', type: 'address' },
  //       { indexed: false, internalType: 'address', name: 'newAdmin', type: 'address' },
  //     ],
  //     name: 'TransferAdmin',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [{ indexed: false, internalType: 'bool', name: 'enableOrDisable', type: 'bool' }],
  //     name: 'UpdateEmergency',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [{ indexed: false, internalType: 'address', name: 'helper', type: 'address' }],
  //     name: 'UpdateHelper',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: true, internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'nftId', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'oldLiquidity', type: 'uint256' },
  //       { indexed: false, internalType: 'uint256', name: 'newLiquidity', type: 'uint256' },
  //     ],
  //     name: 'UpdateLiquidity',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'address', name: 'operator', type: 'address' },
  //       { indexed: false, internalType: 'bool', name: 'grantOrRevoke', type: 'bool' },
  //     ],
  //     name: 'UpdateOperator',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [{ indexed: false, internalType: 'bytes', name: 'farmingTokenCode', type: 'bytes' }],
  //     name: 'UpdateTokenCode',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //       { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'Withdraw',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'uint256', name: 'nftId', type: 'uint256' },
  //       { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'WithdrawEmergency',
  //     type: 'event',
  //   },
  //   {
  //     anonymous: false,
  //     inputs: [
  //       { indexed: false, internalType: 'address', name: 'token', type: 'address' },
  //       { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
  //       { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'WithdrawUnusedRewards',
  //     type: 'event',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'address', name: 'poolAddress', type: 'address' },
  //       {
  //         components: [
  //           { internalType: 'int24', name: 'tickLower', type: 'int24' },
  //           { internalType: 'int24', name: 'tickUpper', type: 'int24' },
  //           { internalType: 'uint32', name: 'weight', type: 'uint32' },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.RangeInput[]',
  //         name: 'ranges',
  //         type: 'tuple[]',
  //       },
  //       {
  //         components: [
  //           { internalType: 'uint32', name: 'startTime', type: 'uint32' },
  //           { internalType: 'uint32', name: 'endTime', type: 'uint32' },
  //           {
  //             components: [
  //               { internalType: 'address', name: 'rewardToken', type: 'address' },
  //               { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
  //             ],
  //             internalType: 'struct IKSElasticLMV2.RewardInput[]',
  //             name: 'rewards',
  //             type: 'tuple[]',
  //           },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.PhaseInput',
  //         name: 'phase',
  //         type: 'tuple',
  //       },
  //       { internalType: 'bool', name: 'isUsingToken', type: 'bool' },
  //     ],
  //     name: 'addFarm',
  //     outputs: [{ internalType: 'uint256', name: 'fId', type: 'uint256' }],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //     ],
  //     name: 'addLiquidity',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       {
  //         components: [
  //           { internalType: 'uint32', name: 'startTime', type: 'uint32' },
  //           { internalType: 'uint32', name: 'endTime', type: 'uint32' },
  //           {
  //             components: [
  //               { internalType: 'address', name: 'rewardToken', type: 'address' },
  //               { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
  //             ],
  //             internalType: 'struct IKSElasticLMV2.RewardInput[]',
  //             name: 'rewards',
  //             type: 'tuple[]',
  //           },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.PhaseInput',
  //         name: 'phaseInput',
  //         type: 'tuple',
  //       },
  //     ],
  //     name: 'addPhase',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       {
  //         components: [
  //           { internalType: 'int24', name: 'tickLower', type: 'int24' },
  //           { internalType: 'int24', name: 'tickUpper', type: 'int24' },
  //           { internalType: 'uint32', name: 'weight', type: 'uint32' },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.RangeInput',
  //         name: 'range',
  //         type: 'tuple',
  //       },
  //     ],
  //     name: 'addRange',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //     ],
  //     name: 'claimReward',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //       { internalType: 'address', name: 'receiver', type: 'address' },
  //     ],
  //     name: 'deposit',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [],
  //     name: 'emergencyEnabled',
  //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [],
  //     name: 'farmCount',
  //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'uint256', name: 'fId', type: 'uint256' }],
  //     name: 'forceClosePhase',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [],
  //     name: 'getAdmin',
  //     outputs: [{ internalType: 'address', name: '', type: 'address' }],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
  //     name: 'getDepositedNFTs',
  //     outputs: [{ internalType: 'uint256[]', name: 'listNFTs', type: 'uint256[]' }],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'uint256', name: 'fId', type: 'uint256' }],
  //     name: 'getFarm',
  //     outputs: [
  //       { internalType: 'address', name: 'poolAddress', type: 'address' },
  //       {
  //         components: [
  //           { internalType: 'int24', name: 'tickLower', type: 'int24' },
  //           { internalType: 'int24', name: 'tickUpper', type: 'int24' },
  //           { internalType: 'uint32', name: 'weight', type: 'uint32' },
  //           { internalType: 'bool', name: 'isRemoved', type: 'bool' },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.RangeInfo[]',
  //         name: 'ranges',
  //         type: 'tuple[]',
  //       },
  //       {
  //         components: [
  //           { internalType: 'uint32', name: 'startTime', type: 'uint32' },
  //           { internalType: 'uint32', name: 'endTime', type: 'uint32' },
  //           { internalType: 'bool', name: 'isSettled', type: 'bool' },
  //           {
  //             components: [
  //               { internalType: 'address', name: 'rewardToken', type: 'address' },
  //               { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
  //             ],
  //             internalType: 'struct IKSElasticLMV2.RewardInput[]',
  //             name: 'rewards',
  //             type: 'tuple[]',
  //           },
  //         ],
  //         internalType: 'struct IKSElasticLMV2.PhaseInfo',
  //         name: 'phase',
  //         type: 'tuple',
  //       },
  //       { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
  //       { internalType: 'address', name: 'farmingToken', type: 'address' },
  //       { internalType: 'uint256[]', name: 'sumRewardPerLiquidity', type: 'uint256[]' },
  //       { internalType: 'uint32', name: 'lastTouchedTime', type: 'uint32' },
  //     ],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [],
  //     name: 'getNft',
  //     outputs: [{ internalType: 'contract IERC721', name: '', type: 'address' }],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'uint256', name: 'nftId', type: 'uint256' }],
  //     name: 'getStake',
  //     outputs: [
  //       { internalType: 'address', name: 'owner', type: 'address' },
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'lastSumRewardPerLiquidity', type: 'uint256[]' },
  //       { internalType: 'uint256[]', name: 'rewardUnclaimed', type: 'uint256[]' },
  //     ],
  //     stateMutability: 'view',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //       { internalType: 'uint128[]', name: 'liquidities', type: 'uint128[]' },
  //       { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
  //       { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
  //       { internalType: 'uint256', name: 'deadline', type: 'uint256' },
  //       { internalType: 'bool', name: 'claimFee', type: 'bool' },
  //     ],
  //     name: 'removeLiquidity',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256', name: 'rangeId', type: 'uint256' },
  //     ],
  //     name: 'removeRange',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'address', name: '_admin', type: 'address' }],
  //     name: 'transferAdmin',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'bool', name: 'enableOrDisable', type: 'bool' }],
  //     name: 'updateEmergency',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'address', name: '_helper', type: 'address' }],
  //     name: 'updateHelper',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'address', name: 'user', type: 'address' },
  //       { internalType: 'bool', name: 'grantOrRevoke', type: 'bool' },
  //     ],
  //     name: 'updateOperator',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'bytes', name: '_farmingTokenCreationCode', type: 'bytes' }],
  //     name: 'updateTokenCode',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'uint256', name: 'fId', type: 'uint256' },
  //       { internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' },
  //     ],
  //     name: 'withdraw',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [{ internalType: 'uint256[]', name: 'nftIds', type: 'uint256[]' }],
  //     name: 'withdrawEmergency',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   {
  //     inputs: [
  //       { internalType: 'address[]', name: 'tokens', type: 'address[]' },
  //       { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
  //     ],
  //     name: 'withdrawUnusedRewards',
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //     type: 'function',
  //   },
  //   { stateMutability: 'payable', type: 'receive' },
  // ])
  //
  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      {(BLACKLIST_WALLETS.includes(isAddressString(chainId, account)) ||
        BLACKLIST_WALLETS.includes(account?.toLowerCase() || '')) && (
        <Modal
          isOpen
          onDismiss={function (): void {
            //
          }}
          maxWidth="600px"
          width="80vw"
        >
          <Flex flexDirection="column" padding="24px" width="100%">
            <Flex alignItems="center">
              <AlertTriangle color={theme.red} />
              <Text fontWeight="500" fontSize={24} color={theme.red} marginLeft="8px">
                <Trans>Warning</Trans>
              </Text>
            </Flex>
            <Text marginTop="24px" fontSize="14px" lineHeight={2}>
              The US Treasury&apos;s OFAC has published a list of addresses associated with Tornado Cash. Your wallet
              address below is flagged as one of the addresses on this list, provided by our compliance vendor. As a
              result, it is blocked from using KyberSwap and all of its related services at this juncture.
            </Text>
            <Flex
              marginTop="24px"
              padding="12px"
              backgroundColor={theme.buttonBlack}
              sx={{ borderRadius: '12px' }}
              flexDirection="column"
            >
              <Text>Your wallet address</Text>
              <Text color={theme.subText} fontSize={20} marginTop="12px" fontWeight="500">
                {isMobile ? shortenAddress(chainId, account || '', 10) : account}
              </Text>
            </Flex>
          </Flex>
        </Modal>
      )}

      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <>
          <AppWrapper>
            <ElasticLegacyNotice />
            <TopBanner />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <Suspense fallback={<Loader />}>
              {holidayMode && (
                <Snowfall
                  speed={[0.5, 1]}
                  wind={[-0.5, 0.25]}
                  snowflakeCount={isMobile ? 13 : 31}
                  images={[snowflake]}
                  radius={[5, 15]}
                />
              )}

              <BodyWrapper>
                <Popups />
                <Web3ReactManager>
                  <Routes>
                    <Route element={<DarkModeQueryParamReader />} />

                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency-to-:toCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network`} element={<SwapPage />} />
                    {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && (
                      <Route path={`${APP_PATHS.CROSS_CHAIN}`} element={<SwapV3 />} />
                    )}

                    {getLimitOrderContract(chainId) && (
                      <>
                        <Route
                          path={`${APP_PATHS.LIMIT}/:network/:fromCurrency-to-:toCurrency`}
                          element={<SwapPage />}
                        />
                        <Route path={`${APP_PATHS.LIMIT}/:network/:fromCurrency`} element={<SwapPage />} />
                        <Route path={`${APP_PATHS.LIMIT}/:network`} element={<SwapPage />} />
                      </>
                    )}

                    <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />
                    <Route path={`${APP_PATHS.POOLS}/:network`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}`} element={<RedirectPathToPoolsNetwork />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA/:currencyIdB`} element={<Pools />} />
                    <Route path={`${APP_PATHS.FARMS}/:network`} element={<Farm />} />
                    <Route path={`${APP_PATHS.FARMS}`} element={<RedirectPathToFarmNetwork />} />
                    <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<Pool />} />
                    <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectPathToMyPoolsNetwork />} />

                    <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}`} element={<CreatePool />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectOldCreatePoolPathStructure />}
                    />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectCreatePoolDuplicateTokenIds />}
                    />

                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/`} element={<AddLiquidity />} />
                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB`} element={<AddLiquidity />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<AddLiquidity />}
                    />

                    <Route
                      path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<RemoveLiquidity />}
                    />
                    <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ProAmmRemoveLiquidity />} />

                    <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/`} element={<RedirectDuplicateTokenIds />} />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB/:feeAmount`}
                      element={<RedirectDuplicateTokenIds />}
                    />

                    <Route
                      path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA/:currencyIdB/:feeAmount/:tokenId`}
                      element={<IncreaseLiquidity />}
                    />
                    <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
                    <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
                    <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
                    <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
                    <Route path={`${APP_PATHS.KYBERAI}`} element={<Navigate to={APP_PATHS.KYBERAI_ABOUT} replace />} />
                    <Route
                      path={`${APP_PATHS.KYBERAI_ABOUT}`}
                      element={
                        <ProtectedRouteKyberAI waitUtilAuthenEndOnly>
                          <KyberAILandingPage />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_RANKINGS}`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_EXPLORE}`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_EXPLORE}/:chain/:address`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}/:slug`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} />
                    <Route path={`${APP_PATHS.VERIFY_EXTERNAL}`} element={<Verify />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}/*`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}`} element={<GrantProgramPage />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}/:slug`} element={<GrantProgramPage />} />
                    {ENV_LEVEL === ENV_TYPE.LOCAL && <Route path="/icons" element={<Icons />} />}

                    <Route path={`elastic-swap`} element={<ElasticSwap />} />

                    <Route path="*" element={<RedirectPathToSwapV3Network />} />
                  </Routes>
                </Web3ReactManager>
              </BodyWrapper>
              {showFooter && <Footer />}
              <TruesightFooter />
            </Suspense>
            <ModalConfirm />
          </AppWrapper>
        </>
      )}
    </ErrorBoundary>
  )
}
