import { Web3Provider } from '@ethersproject/providers'
import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'
import { Wallet, useWallet } from '@solana/wallet-adapter-react'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useSearchParams } from 'react-router-dom'
import { useCheckBlackjackQuery } from 'services/blackjack'

import { blocto, gnosisSafe, krystalWalletConnectV2, walletConnectV2 } from 'constants/connectors/evm'
import { MOCK_ACCOUNT_EVM, MOCK_ACCOUNT_SOLANA } from 'constants/env'
import { SUPPORTED_NETWORKS, isSupportedChainId } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { AppState } from 'state'
import { useKyberSwapConfig } from 'state/application/hooks'
import { detectInjectedType, isEVMWallet, isSolanaWallet } from 'utils'
import { getChainIdFromSlug } from 'utils/string'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  walletKey: SUPPORTED_WALLET | undefined
  walletEVM: { isConnected: boolean; walletKey?: SUPPORTED_WALLET; connector?: Connector; chainId?: ChainId }
  walletSolana: { isConnected: boolean; walletKey?: SUPPORTED_WALLET; wallet: Wallet | null }
  isEVM: boolean
  isSolana: boolean
  networkInfo: NetworkInfo
  isWrongNetwork: boolean
} {
  const [searchParams] = useSearchParams()
  const rawChainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const isWrongNetwork = !isSupportedChainId(rawChainIdState)
  const chainIdState = isWrongNetwork ? ChainId.MAINNET : rawChainIdState
  /**Hook for EVM infos */
  const {
    connector: connectedConnectorEVM,
    active: isConnectedEVM,
    account: evmAccount,
    chainId: chainIdEVM,
  } = useWeb3React()
  /**Hook for Solana infos */
  const { wallet: connectedWalletSolana, connected: isConnectedSolana, publicKey } = useWallet()

  const isEVM = useMemo(() => getChainType(chainIdState) === ChainType.EVM, [chainIdState])
  const isSolana = useMemo(() => getChainType(chainIdState) === ChainType.SOLANA, [chainIdState])

  const addressEVM = evmAccount ?? undefined
  const addressSolana = publicKey?.toBase58()
  const mockAccountParam = searchParams.get('account')
  const account =
    isEVM && addressEVM
      ? mockAccountParam || MOCK_ACCOUNT_EVM || addressEVM
      : isSolana && addressSolana
      ? mockAccountParam || MOCK_ACCOUNT_SOLANA || addressSolana
      : undefined

  const walletKeyEVM = useMemo(() => {
    if (!isConnectedEVM) return undefined
    if (connectedConnectorEVM === walletConnectV2) {
      return 'WALLET_CONNECT'
    }
    if (connectedConnectorEVM === krystalWalletConnectV2) {
      return 'KRYSTAL_WC'
    }
    if (connectedConnectorEVM === gnosisSafe) {
      return 'SAFE'
    }
    if (connectedConnectorEVM === blocto) {
      return 'BLOCTO'
    }
    const detectedWallet = detectInjectedType()

    return (
      detectedWallet ??
      (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
        const wallet = SUPPORTED_WALLETS[walletKey]
        return isEVMWallet(wallet) && isConnectedEVM && wallet.connector === connectedConnectorEVM
      })
    )
  }, [connectedConnectorEVM, isConnectedEVM])

  const walletKeySolana = useMemo(
    () =>
      isConnectedSolana
        ? (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
            const wallet = SUPPORTED_WALLETS[walletKey]
            return isSolanaWallet(wallet) && wallet.adapter === connectedWalletSolana?.adapter
          })
        : undefined,
    [isConnectedSolana, connectedWalletSolana?.adapter],
  )
  return {
    chainId: chainIdState,
    account,
    walletKey: isEVM ? walletKeyEVM : walletKeySolana,
    walletEVM: useMemo(() => {
      return {
        isConnected: isConnectedEVM,
        connector: connectedConnectorEVM,
        walletKey: walletKeyEVM,
        chainId: chainIdEVM,
      }
    }, [isConnectedEVM, connectedConnectorEVM, walletKeyEVM, chainIdEVM]),
    walletSolana: useMemo(() => {
      return {
        isConnected: isConnectedSolana,
        wallet: connectedWalletSolana,
        walletKey: walletKeySolana,
      }
    }, [isConnectedSolana, connectedWalletSolana, walletKeySolana]),
    isEVM: isEVM,
    isSolana: isSolana,
    networkInfo: NETWORKS_INFO[chainIdState],
    isWrongNetwork,
  }
}

type Web3React = {
  connector: Connector
  library: Web3Provider | undefined
  chainId: number | undefined
  account: string | undefined
  active: boolean
}

const wrapProvider = (provider: Web3Provider): Web3Provider =>
  new Proxy(provider, {
    get(target, prop) {
      if (prop === 'send') {
        return (...params: any[]) => {
          if (params[0] === 'eth_chainId') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return target[prop](...params)
          }
          throw new Error('There was an error with your transaction.')
        }
      }
      return target[prop as unknown as keyof Web3Provider]
    },
  })
const cacheProvider = new WeakMap<Web3Provider, Web3Provider>()
const useWrappedProvider = () => {
  const { provider, account } = useWeb3ReactCore<Web3Provider>()
  const { data: blackjackData } = useCheckBlackjackQuery(account ?? '', { skip: !account })

  if (!provider) return undefined
  if (!blackjackData) return provider
  if (!blackjackData.blacklisted) return provider
  let wrappedProvider = cacheProvider.get(provider)
  if (!wrappedProvider) {
    wrappedProvider = wrapProvider(provider)
    cacheProvider.set(provider, wrappedProvider)
  }
  return wrappedProvider
}

export function useWeb3React(): Web3React {
  const { connector, chainId, account, isActive: active } = useWeb3ReactCore<Web3Provider>()
  const provider = useWrappedProvider()

  return {
    connector,
    library: provider,
    chainId,
    account,
    active,
  }
}

export const useWeb3Solana = () => {
  const { connection } = useKyberSwapConfig()
  return { connection }
}

export const useCustomChainId = () => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const { network } = useParams()
  const params = location.pathname.split('/')
  const networkFromUrl = params.map(item => getChainIdFromSlug(item)).filter(Boolean)

  const [searchParams] = useSearchParams()
  const urlChainId = searchParams.get('chainId')
  const chainIdFromParam = urlChainId && SUPPORTED_NETWORKS.includes(+urlChainId) ? +urlChainId : undefined

  const chainId: ChainId = getChainIdFromSlug(network) || networkFromUrl?.[0] || chainIdFromParam || walletChainId
  return { chainId }
}
