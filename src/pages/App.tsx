import * as Sentry from '@sentry/react'
import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'
import styled from 'styled-components'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Kai from 'components/Kai'
import Loader from 'components/LocalLoader'
import ModalsGlobal from 'components/ModalsGlobal'
import ProtectedRoute from 'components/ProtectedRoute'
import SupportButton from 'components/SupportButton'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED, NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAutoLogin } from 'hooks/useLogin'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useSessionExpiredGlobal from 'hooks/useSessionExpire'
import { useSyncNetworkParamWithStore } from 'hooks/web3/useSyncNetworkParamWithStore'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { RedirectPathToSwapV3Network } from 'pages/SwapV3/redirects'
import { isSupportLimitOrder } from 'utils'

import VerifyAuth from './Verify/VerifyAuth'

const Login = lazy(() => import('./Oauth/Login'))
const Logout = lazy(() => import('./Oauth/Logout'))
const Consent = lazy(() => import('./Oauth/Consent'))

const ElasticSnapshot = lazy(() => import('./ElasticSnapshot'))
const MarketOverview = lazy(() => import('./MarketOverview'))

// test page for swap only through elastic
const ElasticSwap = lazy(() => import('./ElasticSwap'))
const SwapV3 = lazy(() => import('./SwapV3'))
const PartnerSwap = lazy(() => import('./PartnerSwap'))
// const Bridge = lazy(() => import('./Bridge'))
const MyPool = lazy(() => import('./MyPool'))

const PoolFinder = lazy(() => import('./PoolFinder'))
const ElasticRemoveLiquidity = lazy(() => import('pages/RemoveLiquidityProAmm'))

const RemoveLiquidity = lazy(() => import('pages/RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import('pages/KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import('pages/KyberDAO/Vote'))
const KNCUtility = lazy(() => import('pages/KyberDAO/KNCUtility'))
const AboutKyberSwap = lazy(() => import('pages//About/AboutKyberSwap'))
const AboutKNC = lazy(() => import('pages/About/AboutKNC'))
//const BuyCrypto = lazy(() => import('pages/BuyCrypto'))

const NotificationCenter = lazy(() => import('pages/NotificationCenter'))

const Campaign = lazy(() => import('pages/Campaign'))
const CampaignMyDashboard = lazy(() => import('pages/Campaign/MyDashboard'))

const Earns = lazy(() => import('pages/Earns'))
const EarnPoolExplorer = lazy(() => import('pages/Earns/PoolExplorer'))
const EarnUserPositions = lazy(() => import('pages/Earns/UserPositions'))
const EarnPositionDetail = lazy(() => import('pages/Earns/PositionDetail'))

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
  const imageList: string[] = SUPPORTED_NETWORKS.map(chainId => [NETWORKS_INFO[chainId].icon])
    .flat()
    .filter(Boolean) as string[]

  imageList.forEach(image => {
    if (image) {
      new Image().src = image
    }
  })
}

const SwapPage = () => {
  useSyncNetworkParamWithStore()
  return <SwapV3 />
}

const RedirectWithNetworkPrefix = () => {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()

  return (
    <Navigate
      to={{
        ...location,
        pathname: `/${networkInfo.route}${location.pathname}`,
      }}
      replace
    />
  )
}

const RedirectWithNetworkSuffix = () => {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${location.pathname}/${networkInfo.route}`,
      }}
      replace
    />
  )
}

const RoutesWithNetworkPrefix = () => {
  const { network } = useParams()
  const { networkInfo, chainId } = useActiveWeb3React()
  const location = useLocation()

  useSyncNetworkParamWithStore()

  if (!network) {
    return <Navigate to={`/${networkInfo.route}${location.pathname}`} replace />
  }

  const chainInfoFromParam = SUPPORTED_NETWORKS.find(chain => NETWORKS_INFO[chain].route === network)
  if (!chainInfoFromParam) {
    return <Navigate to={'/'} replace />
  }

  return (
    <Routes>
      {!CLASSIC_NOT_SUPPORTED()[chainId] && (
        <>
          <Route
            path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
            element={<RemoveLiquidity />}
          />
        </>
      )}

      {!ELASTIC_NOT_SUPPORTED()[chainId] && (
        <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ElasticRemoveLiquidity />} />
      )}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { pathname } = useLocation()
  useAutoLogin()
  const { online } = useNetwork()
  const prevOnline = usePrevious(online)
  useSessionExpiredGlobal()

  const ancestorOrigins = window.location.ancestorOrigins
  const isSafeAppOrigin = !!ancestorOrigins?.[ancestorOrigins.length - 1]?.includes('app.safe.global')

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
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setTags({
        chainId: chainId,
        network: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  useGlobalMixpanelEvents()
  const isPartnerSwap = pathname.includes(APP_PATHS.PARTNER_SWAP)
  const showFooter = !pathname.includes(APP_PATHS.ABOUT) && !isPartnerSwap
  //const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      <AppWrapper>
        <ModalsGlobal />
        {!isPartnerSwap && <TopBanner />}
        <HeaderWrapper>
          <Kai />
          <SupportButton />
          <Header />
        </HeaderWrapper>
        <Suspense fallback={<Loader />}>
          {/*
            holidayMode && (
            <Snowfall
              speed={[0.5, 1]}
              wind={[-0.5, 0.25]}
              snowflakeCount={isMobile ? 13 : 31}
              images={[snowflake]}
              radius={[5, 15]}
            />
          )
          */}

          <BodyWrapper>
            <Popups />
            <Routes>
              {/* From react-router-dom@6.5.0, :fromCurrency-to-:toCurrency no long works, need to manually parse the params */}
              <Route path={`${APP_PATHS.SWAP}/:network/:currency?`} element={<SwapPage />} />
              <Route path={`${APP_PATHS.PARTNER_SWAP}`} element={<PartnerSwap />} />
              {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && !isSafeAppOrigin && (
                <Route path={`${APP_PATHS.CROSS_CHAIN}`} element={<SwapV3 />} />
              )}

              {isSupportLimitOrder(chainId) && (
                <Route path={`${APP_PATHS.LIMIT}/:network/:currency?`} element={<SwapPage />} />
              )}

              <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />
              <>
                {/* My Pools Routes */}
                <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectWithNetworkSuffix />} />
                <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<MyPool />} />
              </>

              <>
                {/* These are old routes and will soon be deprecated - Check: RoutesWithNetworkParam */}
                {/*
                  <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
                  <Route path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/*`} element={<RedirectWithNetworkPrefix />} />
                  */}

                <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />

                <Route path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/*`} element={<RedirectWithNetworkPrefix />} />
              </>

              <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
              <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
              <Route path={`${APP_PATHS.KYBERDAO_KNC_UTILITY}`} element={<KNCUtility />} />
              <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
              <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
              {/*<Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />*/}
              {/* <Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} /> */}
              <Route
                path={`${APP_PATHS.PROFILE_MANAGE}`}
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${APP_PATHS.PROFILE_MANAGE}/*`}
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.DEPRECATED_NOTI_CENTER}
                element={
                  <ProtectedRoute>
                    <NotificationCenter redirectRoute={PROFILE_MANAGE_ROUTES.PREFERENCE} />
                  </ProtectedRoute>
                }
              />

              <Route path={`elastic-swap`} element={<ElasticSwap />} />

              <Route path={`/:network/*`} element={<RoutesWithNetworkPrefix />} />

              <Route path={APP_PATHS.VERIFY_AUTH} element={<VerifyAuth />} />
              <Route path={APP_PATHS.IAM_LOGIN} element={<Login />} />
              <Route path={APP_PATHS.IAM_LOGOUT} element={<Logout />} />
              <Route path={APP_PATHS.IAM_CONSENT} element={<Consent />} />

              <Route path={APP_PATHS.ELASTIC_SNAPSHOT} element={<ElasticSnapshot />} />
              <Route path={APP_PATHS.MARKET_OVERVIEW} element={<MarketOverview />} />

              <Route path={APP_PATHS.AGGREGATOR_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.LIMIT_ORDER_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.REFFERAL_CAMPAIGN} element={<Campaign />} />
              <Route path={APP_PATHS.MY_DASHBOARD} element={<CampaignMyDashboard />} />

              <Route path={APP_PATHS.EARN} element={<Earns />} />
              <Route path={APP_PATHS.EARN_POOLS} element={<EarnPoolExplorer />} />
              <Route path={APP_PATHS.EARN_POSITIONS} element={<EarnUserPositions />} />
              <Route path={APP_PATHS.EARN_POSITION_DETAIL} element={<EarnPositionDetail />} />

              <Route path={APP_PATHS.EARNS} element={<Navigate to={APP_PATHS.EARN} replace />} />
              <Route path={APP_PATHS.EARNS_POOLS} element={<Navigate to={APP_PATHS.EARN_POOLS} replace />} />
              <Route path={APP_PATHS.EARNS_POSITIONS} element={<Navigate to={APP_PATHS.EARN_POSITIONS} replace />} />

              <Route path="*" element={<RedirectPathToSwapV3Network />} />
            </Routes>
          </BodyWrapper>
          {showFooter && <Footer />}
          {!showFooter && <div style={{ marginBottom: '4rem' }} />}
        </Suspense>
      </AppWrapper>
    </ErrorBoundary>
  )
}
