import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QueryParams } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'

import { timings } from '.'

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()

  const filters: QueryParams = useMemo(() => {
    return {
      chainId: +(searchParams.get('chainId') || ChainId.MAINNET),
      page: +(searchParams.get('page') || 0),
      limit: 10,
      interval: searchParams.get('interval') || (timings[1].value as string),
      protocol: searchParams.get('protocol') || '',
      userAddress: account,
      tag: searchParams.get('tag') || '',
      sortBy: searchParams.get('sortBy') || '',
      orderBy: searchParams.get('orderBy') || '',
      q: searchParams.get('q')?.trim() || '',
    }
  }, [searchParams, account])

  const updateFilters = useCallback(
    (key: keyof QueryParams, value: string) => {
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value)
      if (key !== 'sortBy' && key !== 'orderBy' && key !== 'page') searchParams.delete('page')
      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams],
  )

  return {
    filters,
    updateFilters,
  }
}