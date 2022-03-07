import { useEffect, useMemo, useState } from 'react'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'

export interface TrueSightTokenData {
  token_id: number
  id_of_sources: {
    CoinGecko: string
    CoinMarketCap: string
  }
  order: number
  name: string
  symbol: string
  rank: number
  platforms: {
    [p: string]: string
  }
  present_on_chains: string[]
  predicted_date: number
  market_cap: number
  number_holders: number
  trading_volume: number
  price: number
  social_urls: {
    [p: string]: string
  }
  tags: string[] | null
  discovered_on: number
  logo_url: string
  official_web: string
}

export interface TrendingSoonResponse {
  total_number_tokens: number
  tokens: TrueSightTokenData[]
}

export default function useTrendingSoonData(filter: TrueSightFilter, currentPage: number, itemPerPage: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<TrendingSoonResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeframe = filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
        const url = `${
          process.env.REACT_APP_TRUESIGHT_API
        }/api/v1/trending-soon?timeframe=${timeframe}&page_number=${currentPage -
          1}&page_size=${itemPerPage}&search_token_name=${filter.selectedTokenData?.name ??
          ''}&search_tag_name=${filter.selectedTag ?? ''}`
        setError(undefined)
        setIsLoading(true)
        const response = await fetch(url)
        if (response.ok) {
          const json = await response.json()
          const rawResult: TrendingSoonResponse = json.data
          const result = {
            ...rawResult,
            tokens: rawResult.tokens ? rawResult.tokens.sort((a, b) => a.rank - b.rank) : []
          }
          result.tokens = result.tokens.map(token => ({
            ...token,
            // eslint-disable-next-line @typescript-eslint/camelcase
            social_urls: JSON.parse((token.social_urls as unknown) as string)
          }))
          setData(result)
        }
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setError(err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, filter, itemPerPage])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
