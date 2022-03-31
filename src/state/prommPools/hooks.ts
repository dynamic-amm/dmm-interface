import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApolloClient, NormalizedCacheObject, useQuery, useApolloClient, gql } from '@apollo/client'
import { useDispatch, useSelector } from 'react-redux'

import {
  POOL_COUNT,
  POOL_DATA,
  POOLS_BULK_FROM_LIST,
  POOLS_BULK_WITH_PAGINATION,
  POOLS_HISTORICAL_BULK_FROM_LIST,
  POOLS_HISTORICAL_BULK_WITH_PAGINATION,
  USER_POSITIONS,
} from 'apollo/queries'
import { ChainId } from '@vutien/sdk-core'
import { AppState } from '../index'
import { setError, setLoading, setSharedPoolId, updatePools } from './actions'
import { get24hValue, getBlocksFromTimestamps, getPercentChange, getTimestampsForChanges } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { useETHPrice, useExchangeClient } from 'state/application/hooks'
import { FEE_OPTIONS } from 'constants/index'
import { ProMMPoolFields, PROMM_POOLS_BULK } from 'apollo/queries/promm'
import dayjs from 'dayjs'
import { get2DayChange } from 'utils/data'
import { prommClient } from 'apollo/client'

export interface ProMMPoolData {
  // basic token info
  address: string
  feeTier: number

  token0: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
  apr: number
}

export interface UserPosition {
  id: string
  amountDepositedUSD: string
  pool: {
    id: string
    token0: {
      symbol: string
      derivedETH: string
      id: string
    }
    token1: {
      symbol: string
      derivedETH: string
      id: string
    }
  }
}

const PROMM_USER_POSITIONS = gql`
  query positions($owner: Bytes!) {
    positions(where: { owner: $owner }) {
      id
      owner
      amountDepositedUSD
      depositedToken0
      depositedToken1
      pool {
        id
        token0 {
          id
          derivedETH
          symbol
        }
        token1 {
          id
          derivedETH
          symbol
        }
      }
    }
  }
`

export interface UserPositionResult {
  loading: boolean
  error: any
  data: UserPosition[]
}

/**
 * Get my liquidity for all pools
 *
 * @param user string
 */
export function useUserProMMPositions(user: string | null | undefined): UserPositionResult {
  const { chainId } = useActiveWeb3React()
  const { loading, error, data } = useQuery(PROMM_USER_POSITIONS, {
    client: prommClient[chainId as ChainId],
    variables: {
      owner: user?.toLowerCase(),
    },
    fetchPolicy: 'no-cache',
  })

  return useMemo(() => ({ loading, error, data: data?.positions || [] }), [data, error, loading])
}

interface PoolDataResponse {
  pools: ProMMPoolFields[]
}

/**
 * Fetch top addresses by volume
 */
export function usePoolDatas(
  poolAddresses: string[],
): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: ProMMPoolData
      }
    | undefined
} {
  const { chainId } = useActiveWeb3React()
  const dataClient = prommClient[chainId as ChainId]

  const utcCurrentTime = dayjs()
  const t1 = utcCurrentTime
    .subtract(1, 'day')
    .startOf('minute')
    .unix()
  const t2 = utcCurrentTime
    .subtract(2, 'day')
    .startOf('minute')
    .unix()
  const tWeek = utcCurrentTime
    .subtract(1, 'week')
    .startOf('minute')
    .unix()

  const [blocks, setBlocks] = useState<{ number: number }[]>([])

  useEffect(() => {
    const getBlocks = async () => {
      const blocks = await getBlocksFromTimestamps([t1], chainId)
      setBlocks(blocks)
    }

    getBlocks()
  }, [t1, t2, tWeek, chainId])

  // get blocks from historic timestamps
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery<PoolDataResponse>(PROMM_POOLS_BULK(undefined, poolAddresses), {
    client: dataClient,
  })

  const { loading: loading24, error: error24, data: data24 } = useQuery<PoolDataResponse>(
    PROMM_POOLS_BULK(block24?.number, poolAddresses),
    { client: dataClient },
  )
  const { loading: loading48, error: error48, data: data48 } = useQuery<PoolDataResponse>(
    PROMM_POOLS_BULK(block48?.number, poolAddresses),
    { client: dataClient },
  )
  const { loading: loadingWeek, error: errorWeek, data: dataWeek } = useQuery<PoolDataResponse>(
    PROMM_POOLS_BULK(blockWeek?.number, poolAddresses),
    { client: dataClient },
  )

  const anyError = Boolean(error || error24 || error48 || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const parsed = data?.pools
    ? data.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.pools
    ? data24.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.pools
    ? data48.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.pools
    ? dataWeek.pools.reduce((accum: { [address: string]: ProMMPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  // format data and calculate daily changes
  const formatted = poolAddresses.reduce((accum: { [address: string]: ProMMPoolData }, address) => {
    const current: ProMMPoolFields | undefined = parsed[address]
    const oneDay: ProMMPoolFields | undefined = parsed24[address]
    const twoDay: ProMMPoolFields | undefined = parsed48[address]
    const week: ProMMPoolFields | undefined = parsedWeek[address]

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
        ? [parseFloat(current.volumeUSD), 0]
        : [0, 0]

    const volumeUSDWeek =
      current && week
        ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
        : current
        ? parseFloat(current.volumeUSD)
        : 0

    const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

    const tvlUSDChange =
      current && oneDay
        ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
            parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
          100
        : 0

    const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) : 0
    const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) : 0

    const feeTier = current ? parseInt(current.feeTier) : 0

    if (current) {
      accum[address] = {
        address,
        feeTier,
        liquidity: parseFloat(current.liquidity),
        sqrtPrice: parseFloat(current.sqrtPrice),
        tick: parseFloat(current.tick),
        token0: {
          address: current.token0.id,
          name: current.token0.name,
          symbol: current.token0.symbol,
          decimals: parseInt(current.token0.decimals),
          derivedETH: parseFloat(current.token0.derivedETH),
        },
        token1: {
          address: current.token1.id,
          name: current.token1.name,
          symbol: current.token1.symbol,
          decimals: parseInt(current.token1.decimals),
          derivedETH: parseFloat(current.token1.derivedETH),
        },
        token0Price: parseFloat(current.token0Price),
        token1Price: parseFloat(current.token1Price),
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        tvlUSD,
        tvlUSDChange,
        tvlToken0,
        tvlToken1,
        apr: tvlUSD > 0 ? ((volumeUSD / feeTier / 10000) * 365) / tvlUSD : 0,
      }
    }

    return accum
  }, {})

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}

export function useSelectedPool() {
  return useSelector((state: AppState) => state.pools.selectedPool)
}

export function useSharedPoolIdManager(): [string | undefined, (newSharedPoolId: string | undefined) => void] {
  const dispatch = useDispatch()
  const sharedPoolId = useSelector((state: AppState) => state.pools.sharedPoolId)

  const onSetSharedPoolId = useCallback(
    (newSharedPoolId: string | undefined) => {
      dispatch(setSharedPoolId({ poolId: newSharedPoolId }))
    },
    [dispatch],
  )

  return useMemo(() => [sharedPoolId, onSetSharedPoolId], [onSetSharedPoolId, sharedPoolId])
}

export const TOP_POOLS = gql`
  query topPools {
    pools(first: 500, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
    }
  }
`

interface TopPoolsResponse {
  pools: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useTopPoolAddresses(): {
  loading: boolean
  error: boolean
  addresses: string[] | undefined
} {
  const { chainId } = useActiveWeb3React()
  const dataClient = prommClient[chainId as ChainId]

  const { loading, error, data } = useQuery<TopPoolsResponse>(TOP_POOLS, {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })

  const formattedData = useMemo(() => {
    if (data) {
      return data.pools.map(p => p.id)
    } else {
      return undefined
    }
  }, [data])

  return {
    loading: loading,
    error: Boolean(error),
    addresses: formattedData,
  }
}
