import { t } from '@lingui/macro'
import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import routeApi from 'services/route'
import { BuildRouteData, BuildRoutePayload } from 'services/route/types/buildRoute'
import { RouteSummary } from 'services/route/types/getRoute'

import { useRouteApiDomain } from 'components/SwapForm/hooks/useGetRoute'
import { AGGREGATOR_API_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'

export type BuildRouteResult =
  | {
      data: BuildRouteData
      error?: never
    }
  | {
      data?: never
      error: string
    }

type Args = {
  recipient: string
  routeSummary: RouteSummary | undefined
  slippage: number
  transactionTimeout: number
  permit?: string
}

const useBuildRoute = (args: Args) => {
  const { recipient, routeSummary, slippage, transactionTimeout, permit } = args
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const { chainId, account } = useActiveWeb3React()
  const abortControllerRef = useRef(new AbortController())
  const { isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const [buildRoute] = routeApi.useBuildRouteMutation()
  const aggregatorDomain = useRouteApiDomain()
  const recipientLookup = useENS(recipient)
  const to: string | null = (recipient === '' ? account : recipientLookup.address) ?? null

  const fetcher = useCallback(async (): Promise<BuildRouteResult> => {
    if (!account) {
      return {
        error: t`Wallet is not connected`,
      }
    }

    if (!routeSummary) {
      return {
        error: t`Route summary is missing`,
      }
    }

    const payload: BuildRoutePayload = {
      routeSummary,
      deadline: Math.floor(Date.now() / 1000) + transactionTimeout,
      slippageTolerance: slippage,
      sender: account,
      recipient: to || account,
      source: clientId || 'kyberswap',
      skipSimulateTx: false,
      enableGasEstimation: false,
      permit,
    }

    try {
      abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.BUILD_ROUTE}`

      const response = await buildRoute({
        url,
        payload,
        signal: abortControllerRef.current.signal,
        authentication: isEnableAuthenAggregator,
      }).unwrap()
      if (!response?.data?.data) throw new Error('Building route failed')
      return {
        data: response.data,
      }
    } catch (e) {
      if (Array.isArray(e?.data?.errorEntities)) {
        return {
          error: e.data.errorEntities.join(' | '),
        }
      }
      return {
        error: e?.data?.errorEntities?.[0] || e.message || e?.data?.message || t`Something went wrong`,
      }
    }
  }, [
    clientId,
    account,
    aggregatorDomain,
    chainId,
    to,
    routeSummary,
    slippage,
    transactionTimeout,
    buildRoute,
    isEnableAuthenAggregator,
    permit,
  ])

  return fetcher
}

export default useBuildRoute
