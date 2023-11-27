import { Contract, ContractInterface } from '@ethersproject/contracts'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import IUniswapV2PairABI from 'constants/abis/IUniswapV2PairABI.json'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from 'constants/abis/argent-wallet-detector'
import RouterSwapAction from 'constants/abis/bridge/RouterSwapAction.json'
import swapETHABI from 'constants/abis/bridge/swapETHABI.json'
import FACTORY_ABI from 'constants/abis/dmm-factory.json'
import ENS_PUBLIC_RESOLVER_ABI from 'constants/abis/ens-public-resolver.json'
import ENS_ABI from 'constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import ERC20_ABI from 'constants/abis/erc20.json'
import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_V3_ABI from 'constants/abis/fairlaunch-v3.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import KS_STATIC_FEE_FACTORY_ABI from 'constants/abis/ks-factory.json'
import REWARD_LOCKER_V2_ABI from 'constants/abis/reward-locker-v2.json'
import REWARD_LOCKER_ABI from 'constants/abis/reward-locker.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import WETH_ABI from 'constants/abis/weth.json'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useCustomChainId, useWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { FairLaunchVersion, RewardLockerVersion } from 'state/farms/classic/types'
import { useRewardLockerAddressesWithVersion } from 'state/vesting/hooks'
import { getReadingContract, getSigningContract } from 'utils/getContract'

import { useActiveWeb3React } from './index'

// returns null on errors
export function useSigningContract(address: string | undefined, ABI: ContractInterface): Contract | null {
  const { account, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()

  const lib = useMemo(() => (account ? library : null), [account, library])

  return useMemo(() => {
    if (!isEVM || !address || !ABI || !lib) return null
    try {
      return account ? getSigningContract(address, ABI, lib, account) : null
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, lib, account, isEVM])
}

export function useReadingContract(
  address: string | undefined,
  ABI: ContractInterface,
  customChainId?: ChainId,
): Contract | null {
  const { chainId: curChainId } = useCustomChainId()
  const chainId = customChainId || curChainId
  const { readProvider } = useKyberSwapConfig(chainId)

  return useMemo(() => {
    if (!address || !isEVM(chainId) || !readProvider) return null
    try {
      return getReadingContract(address, ABI, readProvider)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, chainId, readProvider])
}

// returns null on errors
export function useMultipleContracts(
  addresses: string[] | undefined,
  ABI: ContractInterface,
  withSignerIfPossible = true,
): {
  [key: string]: Contract
} | null {
  const { account, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { readProvider } = useKyberSwapConfig()

  return useMemo(() => {
    const lib = withSignerIfPossible ? library : readProvider

    if (!isEVM || !addresses || !Array.isArray(addresses) || addresses.length === 0 || !ABI || !lib) return null

    const result: {
      [key: string]: Contract
    } = {}

    try {
      addresses.forEach(address => {
        if (address) {
          result[address] = withSignerIfPossible
            ? getSigningContract(address, ABI, lib as any, withSignerIfPossible && account ? account : undefined)
            : getReadingContract(address, ABI, lib)
        }
      })

      if (Object.keys(result).length > 0) {
        return result
      }

      return null
    } catch (error) {
      console.error('Failed to get contract', error)

      return null
    }
  }, [addresses, ABI, library, withSignerIfPossible, account, isEVM, readProvider])
}

export function useTokenSigningContract(tokenAddress?: string): Contract | null {
  return useSigningContract(tokenAddress, ERC20_ABI)
}

export function useTokenReadingContract(tokenAddress?: string, customChainId?: ChainId): Contract | null {
  return useReadingContract(tokenAddress, ERC20_ABI, customChainId)
}

export function useWETHContract(customChainId?: ChainId): Contract | null {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  return useSigningContract(isEVM(chainId) ? WETH[chainId].address : undefined, WETH_ABI)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useReadingContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
  )
}

export function useENSRegistrarContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined
  if (isEVM(chainId)) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.GÖRLI:
        address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
        break
    }
  }
  return useReadingContract(address, ENS_ABI)
}

export function useENSResolverContract(address: string | undefined): Contract | null {
  return useReadingContract(address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useBytes32TokenContract(tokenAddress?: string): Contract | null {
  return useReadingContract(tokenAddress, ERC20_BYTES32_ABI)
}

export function usePairContract(pairAddress?: string): Contract | null {
  return useReadingContract(pairAddress, IUniswapV2PairABI.abi)
}

export function useMulticallContract(customChainId?: ChainId): Contract | null {
  const { chainId: curChainId } = useCustomChainId()
  const chainId = customChainId || curChainId
  return useReadingContract(isEVM(chainId) ? NETWORKS_INFO[chainId].multicall : undefined, MULTICALL_ABI, chainId)
}

export function useOldStaticFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useReadingContract(isEVM ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.factory : undefined, FACTORY_ABI)
}
export function useStaticFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useReadingContract(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.static.factory : undefined,
    KS_STATIC_FEE_FACTORY_ABI,
  )
}
export function useDynamicFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useReadingContract(isEVM ? (networkInfo as EVMNetworkInfo).classic.dynamic?.factory : undefined, FACTORY_ABI)
}

export function useZapContract(isStaticFeeContract: boolean, isOldStaticFeeContract: boolean): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useReadingContract(
    isEVM
      ? isStaticFeeContract
        ? isOldStaticFeeContract
          ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.zap
          : (networkInfo as EVMNetworkInfo).classic.static.zap
        : (networkInfo as EVMNetworkInfo).classic.dynamic?.zap
      : undefined,
    isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI,
  )
}

export function useProMMFarmSigningContract(address: string): Contract | null {
  return useSigningContract(address, PROMM_FARM_ABI)
}

export function useProMMFarmReadingContract(address: string): Contract | null {
  return useReadingContract(address, PROMM_FARM_ABI)
}

function useFairLaunchV1Contracts(): {
  [key: string]: Contract
} | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useMultipleContracts(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunch : undefined,
    FAIRLAUNCH_ABI,
    false,
  )
}

function useFairLaunchV2Contracts(): {
  [key: string]: Contract
} | null {
  const { networkInfo, isEVM } = useActiveWeb3React()

  return useMultipleContracts(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunchV2 : undefined,
    FAIRLAUNCH_V2_ABI,
    false,
  )
}

function useFairLaunchV3Contracts(): {
  [key: string]: Contract
} | null {
  const { networkInfo, isEVM } = useActiveWeb3React()

  return useMultipleContracts(
    isEVM && (networkInfo as EVMNetworkInfo).classic.fairlaunchV3?.length
      ? (networkInfo as EVMNetworkInfo).classic.fairlaunchV3
      : undefined,
    FAIRLAUNCH_V3_ABI,
    false,
  )
}

export function useFairLaunchContracts(): {
  [key: string]: Contract
} | null {
  const fairLaunchV1Contracts = useFairLaunchV1Contracts()
  const fairLaunchV2Contracts = useFairLaunchV2Contracts()
  const fairLaunchV3Contracts = useFairLaunchV3Contracts()

  const fairLaunchContracts = useMemo(() => {
    return { ...fairLaunchV1Contracts, ...fairLaunchV2Contracts, ...fairLaunchV3Contracts }
  }, [fairLaunchV1Contracts, fairLaunchV2Contracts, fairLaunchV3Contracts])

  return fairLaunchContracts
}

export const useFairLaunchVersion = (address: string): FairLaunchVersion => {
  const { isEVM, networkInfo } = useActiveWeb3React()
  let version = FairLaunchVersion.V1
  if (!isEVM) return version

  // Use .find to search with case insensitive
  const isV2 = (networkInfo as EVMNetworkInfo).classic.fairlaunchV2.find(a => {
    return a.toLowerCase() === address.toLowerCase()
  })

  // Use .find to search with case insensitive
  const isV3 = (networkInfo as EVMNetworkInfo).classic.fairlaunchV3?.find(a => {
    return a.toLowerCase() === address.toLowerCase()
  })

  // Even if we have V3 in the future, we can update it here

  if (isV2) {
    version = FairLaunchVersion.V2
  }

  if (isV3) version = FairLaunchVersion.V3

  return version
}

function useFairLaunchABI(address: string) {
  const version = useFairLaunchVersion(address)
  let abi

  switch (version) {
    case FairLaunchVersion.V1:
      abi = FAIRLAUNCH_ABI
      break
    case FairLaunchVersion.V2:
      abi = FAIRLAUNCH_V2_ABI
      break
    case FairLaunchVersion.V3:
      abi = FAIRLAUNCH_V3_ABI
      break
    default:
      abi = FAIRLAUNCH_ABI
      break
  }
  return abi
}
export function useFairLaunchSigningContract(address: string): Contract | null {
  const abi = useFairLaunchABI(address)

  return useSigningContract(address, abi)
}

export function useFairLaunchRadingContract(address: string): Contract | null {
  const abi = useFairLaunchABI(address)

  return useReadingContract(address, abi)
}

export function useRewardLockerContracts(withSignerIfPossible?: boolean): {
  [key: string]: Contract
} | null {
  const rewardLockerAddressesWithVersion = useRewardLockerAddressesWithVersion()
  const rewardLockerV1Addresses = useMemo(
    () =>
      Object.keys(rewardLockerAddressesWithVersion).filter(
        address => rewardLockerAddressesWithVersion[address] === RewardLockerVersion.V1,
      ),
    [rewardLockerAddressesWithVersion],
  )
  const rewardLockerV2Addresses = useMemo(
    () =>
      Object.keys(rewardLockerAddressesWithVersion).filter(
        address => rewardLockerAddressesWithVersion[address] === RewardLockerVersion.V2,
      ),
    [rewardLockerAddressesWithVersion],
  )
  const rewardLockerV1Contracts = useMultipleContracts(rewardLockerV1Addresses, REWARD_LOCKER_ABI, withSignerIfPossible)
  const rewardLockerV2Contracts = useMultipleContracts(
    rewardLockerV2Addresses,
    REWARD_LOCKER_V2_ABI,
    withSignerIfPossible,
  )
  return useMemo(
    () => ({ ...rewardLockerV1Contracts, ...rewardLockerV2Contracts }),
    [rewardLockerV1Contracts, rewardLockerV2Contracts],
  )
}

export function useRewardLockerContract(address: string): Contract | null {
  return useSigningContract(address, REWARD_LOCKER_ABI)
}

export function useProAmmNFTPositionManagerSigningContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useSigningContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
    NFTPositionManagerABI.abi,
  )
}

export function useProAmmNFTPositionManagerReadingContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useReadingContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
    NFTPositionManagerABI.abi,
  )
}

export function useProAmmTickReader(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useReadingContract(isEVM ? (networkInfo as EVMNetworkInfo).elastic.tickReader : undefined, TickReaderABI.abi)
}

// bridge
export function useSwapETHContract(tokenAddress?: string): Contract | null {
  return useSigningContract(tokenAddress, swapETHABI)
}

export function useBridgeContract(routerToken?: any): Contract | null {
  return useSigningContract(routerToken ? routerToken : undefined, RouterSwapAction)
}
