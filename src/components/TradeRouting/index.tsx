import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import CurrencyLogo from 'components/CurrencyLogo'
import { getDexInfoByPool, getSwapPercent, onScroll, useShadow } from 'components/TradeRouting/helpers'
import {
  Shadow,
  StyledContainer,
  StyledDot,
  StyledExchange,
  StyledExchangeStatic,
  StyledHop,
  StyledHopChevronRight,
  StyledHopChevronWrapper,
  StyledHops,
  StyledPair,
  StyledPairLine,
  StyledPercent,
  StyledRoute,
  StyledRouteLine,
  StyledRoutes,
  StyledToken,
  StyledWrap,
  StyledWrapToken,
} from 'components/TradeRouting/styled'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { getEtherscanLink, isAddress } from 'utils'
import { SwapRouteV2 } from 'utils/aggregationRouting'

interface RouteRowProps {
  route: SwapRouteV2
  chainId: ChainId
  backgroundColor?: string
}

const RouteRow = ({ route, chainId, backgroundColor }: RouteRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const allDexes = useAllDexes(chainId)
  const handleShadow = useShadow(scrollRef, shadowRef, contentRef)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  return (
    <StyledWrap ref={shadowRef} backgroundColor={backgroundColor}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <StyledHops length={route?.subRoutes?.length} ref={contentRef}>
          {route.subRoutes.map((subRoute, index, arr) => {
            const token = route.path[index + 1]
            const id = subRoute
              .flat()
              .map(item => item.id)
              .join('-')

            return (
              <React.Fragment key={id}>
                <StyledHop>
                  <TokenRoute token={token} />
                  {Array.isArray(subRoute)
                    ? subRoute.map(pool => {
                        const dex = getDexInfoByPool(pool, allDexes)
                        const poolId = pool.id.split('-')?.[0]
                        const link = (i => {
                          // TODO: viet-nv remove condition
                          return isAddress(chainId, poolId) && !['1inch', 'paraswap', '0x'].includes(pool.exchange) ? (
                            <StyledExchange
                              key={`${i}-${pool.id}`}
                              href={getEtherscanLink(chainId, poolId, 'address')}
                              target="_blank"
                            >
                              {i}
                            </StyledExchange>
                          ) : (
                            <StyledExchangeStatic key={`${i}-${pool.id}`}>{i}</StyledExchangeStatic>
                          )
                        })(
                          <>
                            {dex?.logoURL ? (
                              <img src={dex?.logoURL} alt="" className="img--sm" />
                            ) : (
                              <i className="img--sm" />
                            )}
                            {`${dex?.name || '--'}: ${pool.swapPercentage}%`}
                          </>,
                        )
                        return link
                      })
                    : null}
                </StyledHop>
                {index !== arr.length - 1 && (
                  <StyledHopChevronWrapper>
                    <StyledHopChevronRight />
                  </StyledHopChevronWrapper>
                )}
              </React.Fragment>
            )
          })}
        </StyledHops>
      </ScrollContainer>
    </StyledWrap>
  )
}

interface RoutingProps {
  maxHeight?: string

  tradeComposition: SwapRouteV2[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  customChainId?: ChainId
}

const Routing = ({
  customChainId,
  tradeComposition,
  maxHeight,
  inputAmount,
  outputAmount,
  currencyIn,
  currencyOut,
}: RoutingProps) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const renderTokenInfo = (
    currency: Currency | undefined,
    amount: CurrencyAmount<Currency> | undefined,
    reverseOrder?: boolean,
  ) => {
    if (chainId && currency) {
      return (
        <StyledToken as="div" reverse={reverseOrder} style={{ border: 'none' }}>
          <CurrencyLogo currency={currency} size="20px" />
          <span>{`${amount ? amount.toSignificant(6) : ''} ${currency.symbol}`}</span>
        </StyledToken>
      )
    }

    return null
  }

  const hasRoutes = chainId && tradeComposition && tradeComposition.length > 0

  const handleScroll = useCallback(() => {
    return onScroll(shadowRef.current)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [tradeComposition, maxHeight, handleScroll])

  return (
    <Shadow ref={shadowRef}>
      <StyledContainer ref={wrapperRef} onScroll={handleScroll} style={{ maxHeight: maxHeight || '100%' }}>
        <div ref={contentRef}>
          <StyledPair>
            <StyledWrapToken>{renderTokenInfo(currencyIn, inputAmount)}</StyledWrapToken>
            {!hasRoutes && <StyledPairLine />}
            <StyledWrapToken>{renderTokenInfo(currencyOut, outputAmount, true)}</StyledWrapToken>
          </StyledPair>

          {hasRoutes ? (
            <div>
              <StyledRoutes>
                <StyledDot />
                <StyledDot out />
                {tradeComposition.map(route => (
                  <StyledRoute key={route.id}>
                    <StyledPercent>{getSwapPercent(route.swapPercentage, tradeComposition.length)}</StyledPercent>
                    <StyledRouteLine />
                    <RouteRow route={route} chainId={chainId} />
                    <StyledHopChevronWrapper style={{ marginRight: '2px' }}>
                      <StyledHopChevronRight />
                    </StyledHopChevronWrapper>
                  </StyledRoute>
                ))}
              </StyledRoutes>
            </div>
          ) : null}
        </div>
      </StyledContainer>
    </Shadow>
  )
}

const TokenRoute = ({ token }: { token: Token }) => {
  const currency = useCurrencyV2(token.wrapped.address, token.chainId)
  return (
    <StyledToken
      style={{ marginRight: 0 }}
      href={getEtherscanLink(token.chainId, token?.wrapped.address, 'token')}
      target="_blank"
    >
      <CurrencyLogo currency={currency} size="16px" />
      <span>{currency?.symbol}</span>
    </StyledToken>
  )
}

export default memo(Routing)
