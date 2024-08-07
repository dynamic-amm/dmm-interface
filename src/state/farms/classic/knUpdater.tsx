import { BigNumber } from '@ethersproject/bignumber'
import { Token, WETH } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import { useEffect } from 'react'
import { ClassicFarmKN, useLazyGetFarmClassicQuery } from 'services/knprotocol'

import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_V3_ABI from 'constants/abis/fairlaunch-v3.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { AbortedError, ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { setFarmsData, setLoading, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm, FarmV1, FarmV2 } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { getReadingContract } from 'utils/getContract'
import { parseFraction, toString } from 'utils/numbers'

const KNUpdater = ({ isInterval = true }: { isInterval?: boolean }) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const { isEnableKNProtocol, readProvider } = useKyberSwapConfig()
  const [fetchFarmKN] = useLazyGetFarmClassicQuery()

  useEffect(() => {
    const abortController = new AbortController()

    async function getListFarmsKN(): Promise<Farm[]> {
      try {
        const farmsKN: ClassicFarmKN[] | undefined = (await fetchFarmKN(chainId)).data?.data.farmPools
        if (!farmsKN) return []

        const mapping = await Promise.all(
          farmsKN.map(async farmPool => {
            const [fairLaunchAddress] = farmPool.id.split('_')
            const pid = Number(farmPool.pid)
            const id = farmPool.pool.id
            // const version =
            //   farmPool.version === 1
            //     ? FairLaunchVersion.V1
            //     : farmPool.version === 2
            //     ? FairLaunchVersion.V2
            //     : FairLaunchVersion.V3
            // todo viet-nv: subgraph issue, revert this later
            const version: FairLaunchVersion =
              Number(farmPool.start) < 1_000_000_000 ? FairLaunchVersion.V1 : FairLaunchVersion.V2
            const rewardTokens: Token[] = farmPool.rewardTokens.map(({ id, decimals, symbol, name }) =>
              id === ZERO_ADDRESS ? WETH[chainId] : new Token(chainId, id, Number(decimals), symbol, name),
            )
            const totalStake = parseFraction(farmPool.stakedAmount).divide(10 ** 18)
            const stakeToken = id
            const token0: Token =
              farmPool.pool.token0.id === ZERO_ADDRESS
                ? WETH[chainId]
                : new Token(
                    chainId,
                    farmPool.pool.token0.id,
                    Number(farmPool.pool.token0.decimals),
                    farmPool.pool.token0.symbol,
                    farmPool.pool.token0.name,
                  )
            const token1: Token =
              farmPool.pool.token1.id === ZERO_ADDRESS
                ? WETH[chainId]
                : new Token(
                    chainId,
                    farmPool.pool.token1.id,
                    Number(farmPool.pool.token1.decimals),
                    farmPool.pool.token1.symbol,
                    farmPool.pool.token1.name,
                  )
            const amp = Number(farmPool.pool.amp)
            const reserve0 = farmPool.pool.reserve0
            const reserve1 = farmPool.pool.reserve1
            const reserveUSD = farmPool.pool.reserveUSD
            const totalSupply = farmPool.pool.totalSupply
            const oneDayFeeUSD = parseFraction(farmPool.pool.feeUSD)
              .subtract(parseFraction(farmPool.pool.feesUsdOneDayAgo))
              .toFixed(18)
            const oneDayFeeUntracked = '0'
            const rewardPerUnits: BigNumber[] = farmPool.rewardPerUnits.map(i => parseUnits(toString(i), 0))
            const start = Number(farmPool.start)
            const end = Number(farmPool.end)

            const userData = await (async () => {
              if (!account) return {}
              if (!readProvider) return {}
              try {
                const contract = getReadingContract(
                  fairLaunchAddress,
                  version === FairLaunchVersion.V1
                    ? FAIRLAUNCH_ABI
                    : version === FairLaunchVersion.V2
                    ? FAIRLAUNCH_V2_ABI
                    : FAIRLAUNCH_V3_ABI,
                  readProvider,
                )

                const stakedBalance = (await contract.getUserInfo(pid, account)).amount
                if (abortController.signal.aborted) throw new AbortedError()
                const pendingRewards: BigNumber[] = await contract.pendingRewards(pid, account)
                if (abortController.signal.aborted) throw new AbortedError()

                const userData = {
                  stakedBalance,
                  rewards:
                    version === FairLaunchVersion.V1
                      ? pendingRewards
                      : pendingRewards.map((pendingReward, index) =>
                          pendingReward.div(10 ** (18 - rewardTokens[index].decimals)),
                        ),
                }
                return userData
              } catch (e) {
                if (!abortController.signal.aborted) {
                  console.error('fetch userData error', e)
                }
                return {}
              }
            })()

            if (version === FairLaunchVersion.V1) {
              return {
                fairLaunchAddress,
                version,
                pid,
                id,
                rewardTokens,
                rewardPerBlocks: rewardPerUnits,
                totalStake,
                stakeToken,
                startBlock: start,
                endBlock: end,
                token0,
                token1,
                amp,
                reserve0,
                reserve1,
                reserveUSD,
                totalSupply,
                oneDayFeeUSD,
                oneDayFeeUntracked,
                userData,
              } as FarmV1
            }

            return {
              fairLaunchAddress,
              version,
              pid,
              id,
              rewardTokens,
              rewardPerSeconds: rewardPerUnits,
              totalStake,
              stakeToken,
              startTime: start,
              endTime: end,
              token0,
              token1,
              amp,
              reserve0,
              reserve1,
              reserveUSD,
              totalSupply,
              oneDayFeeUSD,
              oneDayFeeUntracked,
              userData,
            } as FarmV2
          }),
        )
        return mapping
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('parse kn error', { error })
        }
        throw error
      }
    }

    async function checkForFarms() {
      try {
        dispatch(setLoading(true))

        const farms: Farm[] = await getListFarmsKN()
        if (abortController.signal.aborted) throw new AbortedError()
        const data = farms.reduce((acc, cur) => {
          const id = cur.fairLaunchAddress
          if (!acc[id]) acc[id] = []
          acc[id].push(cur)
          return acc
        }, {} as { [key: string]: Farm[] })

        dispatch(setFarmsData(data))
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('fetch farmData KN error', { error: err })
          dispatch(setYieldPoolsError(err as Error))
        }
      } finally {
        dispatch(setLoading(false))
      }
    }

    dispatch(setFarmsData({}))
    checkForFarms()

    const i =
      isInterval &&
      setInterval(() => {
        checkForFarms()
      }, 30_000)

    return () => {
      abortController.abort()
      i && clearInterval(i)
    }
  }, [fetchFarmKN, dispatch, chainId, account, isEnableKNProtocol, isInterval, readProvider])

  return null
}
export default KNUpdater
