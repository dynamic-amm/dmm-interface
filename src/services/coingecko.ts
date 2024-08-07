import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'

import { NETWORKS_INFO } from 'constants/networks'
import { fetchCoingeckoData } from 'hooks/useBasicChartData'

export type SecurityInfo = {
  is_open_source: string
  is_proxy: string
  is_mintable: string
  can_take_back_ownership: string
  external_call: string
  owner_change_balance: string
  selfdestruct: string
  anti_whale_modifiable: string
  is_anti_whale: string
  is_whitelisted: string
  is_blacklisted: string
  cannot_sell_all: string
  sell_tax: string
  buy_tax: string
  slippage_modifiable: string
  is_honeypot: string
  cannot_buy: string
  gas_abuse: string
}

const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: baseQueryOauthDynamic({ baseUrl: '' }),
  endpoints: builder => ({
    getMarketTokenInfo: builder.query<any, { chainId: ChainId; address: string; coingeckoAPI: string }>({
      query: ({ chainId, address, coingeckoAPI }) => ({
        url:
          address.toLowerCase() === WETH[chainId].address.toLowerCase()
            ? `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNativeTokenId}`
            : `${coingeckoAPI}/coins/${NETWORKS_INFO[chainId].coingeckoNetworkId}/contract/${address}`,
        authentication: true,
      }),
    }),
    getLiquidityMarkets: builder.query({
      query: ({ coingeckoAPI, id }) => ({
        url: `${coingeckoAPI}/coins/${id}/tickers?include_exchange_logo=true`,
        authentication: true,
      }),
    }),
    getSecurityTokenInfo: builder.query<SecurityInfo, { chainId: ChainId; address: string }>({
      query: ({ chainId, address }) => ({
        url: `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
      }),
      transformResponse: (data: any, _, arg) => data?.result?.[arg.address.toLowerCase()],
    }),
    fetchCoingeckoData: builder.query<
      any,
      { tokenAddresses: string[]; chainIds: ChainId[]; timeFrame: any; coingeckoAPI: string }
    >({
      queryFn: async ({ tokenAddresses, chainIds, timeFrame, coingeckoAPI }): Promise<any> => {
        const data = await fetchCoingeckoData([tokenAddresses, chainIds, timeFrame, coingeckoAPI])
        return { data }
      },
    }),
  }),
})

// todo viet-nv (now) move basic chart api to this file
export const { useGetMarketTokenInfoQuery, useGetLiquidityMarketsQuery, useGetSecurityTokenInfoQuery } = coingeckoApi

export default coingeckoApi
