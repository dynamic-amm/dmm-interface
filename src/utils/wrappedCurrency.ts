import { ChainId, Currency, WETH } from '@vutien/sdk-core'
import { nativeOnChain } from 'constants/tokens'

export function unwrappedToken(token: Currency): Currency {
  if (token.equals(WETH[token.chainId as ChainId])) return nativeOnChain(token.chainId)

  return token
}
