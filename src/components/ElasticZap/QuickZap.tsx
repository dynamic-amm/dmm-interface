import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import mixpanel from 'mixpanel-browser'
import { rgba } from 'polished'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as ZapIcon } from 'assets/svg/zap.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import PriceImpactNote, { PRICE_IMPACT_EXPLANATION_URL, TextUnderlineColor } from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import WarningNote from 'components/WarningNote'
import { abi } from 'constants/abis/v2/ProAmmPoolState.json'
import { APP_PATHS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useZapInAction, useZapInPoolResult } from 'hooks/elasticZap'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmTickReader, useReadingContract } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useWalletModalToggle } from 'state/application/hooks'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import { RANGE } from 'state/mint/proamm/type'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { formattedNum } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

import RangeSelector, { FARMING_RANGE, useTicksFromRange } from './RangeSelector'
import ZapDetail, { useZapDetail } from './ZapDetail'

const QuickZapButtonWrapper = styled(ButtonOutlined)<{ size: 'small' | 'medium' }>`
  padding: 0;
  width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  max-width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  height: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  background: ${({ theme, disabled }) => rgba(disabled ? theme.subText : theme.warning, 0.2)};
  color: ${({ theme, disabled }) => (disabled ? theme.subText : '#FF9901')};
  &:hover {
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
    border: 1px solid ${({ theme, disabled }) => rgba(disabled ? theme.subText : theme.warning, 0.2)};
  }

  border: 1px solid ${({ theme, disabled }) => rgba(disabled ? theme.subText : theme.warning, 0.2)};

  &:active {
    box-shadow: none;
  }

  &:focus {
    box-shadow: none;
  }
`

const Content = styled.div`
  padding: 1rem;
  width: 100%;
`

const Overlay = styled.div<{ overlay: boolean }>`
  opacity: ${({ overlay }) => (overlay ? 0.4 : 1)};
  pointer-events: ${({ overlay }) => (overlay ? 'none' : '')};
`

export const QuickZapButton = ({
  onClick,
  size = 'medium',
}: {
  onClick: (e: React.MouseEvent<HTMLElement>) => void
  size?: 'small' | 'medium'
}) => {
  const { networkInfo } = useActiveWeb3React()
  const isZapAvailable = !!(networkInfo as EVMNetworkInfo).elastic.zap
  const theme = useTheme()

  return (
    <MouseoverTooltip
      text={
        isZapAvailable ? (
          <Trans>Quickly zap and add liquidity using only one token.</Trans>
        ) : (
          <Trans>Zap will be available soon.</Trans>
        )
      }
    >
      <QuickZapButtonWrapper
        onClick={onClick}
        size={size}
        disabled={!isZapAvailable}
        color={!isZapAvailable ? theme.subText : theme.warning}
      >
        <ZapIcon />
      </QuickZapButtonWrapper>
    </MouseoverTooltip>
  )
}

type Props = {
  poolAddress: string
  tokenId?: string | number | BigNumber
  isOpen: boolean
  onDismiss: () => void
  expectedChainId?: number
}

export default function QuickZap(props: Props) {
  if (!props.isOpen) return null

  return <QuickZapModal {...props} />
}

function QuickZapModal({ isOpen, onDismiss, poolAddress, tokenId, expectedChainId }: Props) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const zapInContractAddress = (networkInfo as EVMNetworkInfo).elastic.zap?.router
  const { changeNetwork } = useChangeNetwork()
  const theme = useTheme()
  const [selectedRange, setSelectedRange] = useState<RANGE | FARMING_RANGE | null>(null)

  const { farms: elasticFarmV2s } = useElasticFarmsV2()
  const farmV2 = elasticFarmV2s
    ?.filter(farm => farm.endTime > Date.now() / 1000 && !farm.isSettled)
    .find(farm => farm.poolAddress.toLowerCase() === poolAddress.toLowerCase())

  const toggleWalletModal = useWalletModalToggle()
  const poolContract = useReadingContract(poolAddress, abi)

  const { loading: loadingPos, position: positionDetail } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )

  const { loading: loadingPoolState, result: poolStateRes } = useSingleCallResult(poolContract, 'getPoolState')
  const { loading: loadingToken0, result: token0Res } = useSingleCallResult(
    poolContract,
    'token0',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingToken1, result: token1Res } = useSingleCallResult(
    poolContract,
    'token1',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingFee, result: feeRes } = useSingleCallResult(
    poolContract,
    'swapFeeUnits',
    undefined,
    NEVER_RELOAD,
  )

  const { loading: loadingLiqState, result: liqStateRes } = useSingleCallResult(poolContract, 'getLiquidityState')

  const token0 = useToken(token0Res?.[0])
  const token1 = useToken(token1Res?.[0])

  const currency0 = token0 ? unwrappedToken(token0.wrapped) : undefined
  const currency1 = token1 ? unwrappedToken(token1.wrapped) : undefined

  const pool = useMemo(() => {
    const fee = feeRes?.[0]
    if (!liqStateRes || !poolStateRes || !token0 || !token1 || !fee) return null

    return new Pool(
      token0.wrapped,
      token1.wrapped,
      fee as FeeAmount,
      poolStateRes.sqrtP,
      liqStateRes.baseL,
      liqStateRes.reinvestL,
      poolStateRes.currentTick,
    )
  }, [token0, token1, poolStateRes, liqStateRes, feeRes])

  const position = useMemo(() => {
    if (!positionDetail || !pool) return null
    return new Position({
      pool,
      tickLower: positionDetail.tickLower,
      tickUpper: positionDetail.tickUpper,
      liquidity: positionDetail.liquidity.toString(),
    })
  }, [positionDetail, pool])

  const loading = loadingPoolState || loadingLiqState || loadingToken0 || loadingToken1 || loadingFee || loadingPos

  const outOfRange =
    !!position && (position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper)

  const currencies = useMemo(
    () => [currency0, currency1, currency0?.wrapped, currency1?.wrapped],
    [currency0, currency1],
  )
  const balances = useCurrencyBalances(currencies)

  const [isReverse, setIsReverse] = useState(false)
  const [useWrapped, setUseWrapped] = useState(false)

  const selectedCurrency = useMemo(() => {
    const currency = isReverse ? currency1 : currency0
    if (useWrapped) return currency?.wrapped
    return currency ? unwrappedToken(currency) : currency
  }, [isReverse, currency0, currency1, useWrapped])

  const quoteCurrency = useMemo(() => {
    return isReverse ? currency0 : currency1
  }, [isReverse, currency0, currency1])

  const [typedValue, setTypedValue] = useState('')
  const debouncedValue = useDebounce(typedValue, 300)

  const amountIn = useParsedAmount(selectedCurrency, debouncedValue)

  useEffect(() => {
    if (amountIn?.toExact()) {
      mixpanel.track('Zap - Input detailed', {
        token0: selectedCurrency?.symbol,
        token1: quoteCurrency?.symbol,
        zap_token: selectedCurrency?.symbol,
        token_amount: amountIn.toExact(),
        source: tokenId ? 'my_pool_page' : 'pool_page',
      })
    }
    // eslint-disable-next-line
  }, [amountIn?.toExact(), selectedCurrency])

  const equivalentQuoteAmount =
    amountIn && pool && selectedCurrency && amountIn.multiply(pool.priceOf(selectedCurrency.wrapped))

  const [tickLower, tickUpper] = useTicksFromRange(selectedRange, pool || undefined)
  const tickReader = useProAmmTickReader()

  const vTickLower = position ? position.tickLower : tickLower
  const vTickUpper = position ? position.tickUpper : tickUpper
  const results = useSingleContractMultipleData(tickReader, 'getNearestInitializedTicks', [
    [poolAddress, vTickLower],
    [poolAddress, vTickUpper],
  ])

  const tickPrevious = useMemo(() => {
    return results.map(call => call.result?.previous)
  }, [results])

  const params = useMemo(() => {
    return amountIn?.greaterThan('0') && selectedCurrency && quoteCurrency
      ? {
          poolAddress,
          tokenIn: selectedCurrency.wrapped.address,
          tokenOut: quoteCurrency.wrapped.address,
          amountIn,
          tickLower: vTickLower,
          tickUpper: vTickUpper,
        }
      : undefined
  }, [amountIn, poolAddress, selectedCurrency, vTickLower, vTickUpper, quoteCurrency])

  const { loading: zapLoading, result, aggregatorData } = useZapInPoolResult(params)
  const [approvalState, approve] = useApproveCallback(amountIn, zapInContractAddress)
  const { zapIn } = useZapInAction()

  const balanceIndex = useWrapped ? (isReverse ? 3 : 2) : isReverse ? 1 : 0

  let error: ReactElement | null = null
  if (!typedValue) error = <Trans>Enter an amount</Trans>
  else if (!amountIn) error = <Trans>Invalid Input</Trans>
  else if (balances[balanceIndex] && amountIn?.greaterThan(balances[balanceIndex]))
    error = <Trans>Insufficient Balance</Trans>
  else if (!result) error = <Trans>Insufficient Liquidity</Trans>

  const renderActionName = () => {
    if (error) return error
    if (approvalState === ApprovalState.PENDING)
      return (
        <Dots>
          <Trans>Approving</Trans>
        </Dots>
      )
    if (approvalState !== ApprovalState.APPROVED) return <Trans>Approve</Trans>

    if (zapLoading)
      return (
        <Dots>
          <Trans>Loading</Trans>
        </Dots>
      )
    if (!!position) return <Trans>Increase Liquidity</Trans>
    return <Trans>Add Liquidity</Trans>
  }

  const symbol0 = getTokenSymbolWithHardcode(
    chainId,
    token0?.wrapped.address,
    useWrapped ? currency0?.wrapped.symbol : currency0?.symbol,
  )
  const symbol1 = getTokenSymbolWithHardcode(
    chainId,
    token1?.wrapped.address,
    useWrapped ? currency1?.wrapped.symbol : currency1?.symbol,
  )

  const [attempingTx, setAttempingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setError] = useState('')
  const addTransactionWithType = useTransactionAdder()

  const zapDetail = useZapDetail({
    pool,
    tokenIn: selectedCurrency?.wrapped.address,
    tokenId: tokenId?.toString(),
    position,
    zapResult: result,
    amountIn,
    poolAddress,
    tickLower: vTickLower,
    tickUpper: vTickUpper,
    previousTicks: tickPrevious,
    aggregatorRoute: aggregatorData,
  })

  const { newPosDraft } = zapDetail

  const handleClick = async () => {
    if (approvalState === ApprovalState.NOT_APPROVED) {
      approve()
      return
    }

    if (selectedCurrency && (tokenId || tickPrevious.every(Boolean)) && result && amountIn?.quotient && pool) {
      try {
        setAttempingTx(true)

        const { hash: txHash } = await zapIn(
          {
            tokenId: tokenId ? tokenId.toString() : 0,
            tokenIn: selectedCurrency.wrapped.address,
            amountIn: amountIn.quotient.toString(),
            equivalentQuoteAmount: equivalentQuoteAmount?.quotient.toString() || '0',
            poolAddress,
            tickLower: vTickLower,
            tickUpper: vTickUpper,
            tickPrevious: [tickPrevious[0], tickPrevious[1]],
            poolInfo: {
              token0: pool.token0.wrapped.address,
              fee: pool.fee,
              token1: pool.token1.wrapped.address,
            },
            liquidity: result.liquidity.toString(),
            aggregatorRoute: aggregatorData,
          },
          {
            zapWithNative: selectedCurrency.isNative,
          },
        )

        setTxHash(txHash)
        addTransactionWithType({
          hash: txHash,
          type: TRANSACTION_TYPE.ELASTIC_ZAP_IN_LIQUIDITY,
          extraInfo: {
            zapSymbolIn: selectedCurrency?.symbol ?? '',
            tokenSymbolIn: symbol0 ?? '',
            tokenSymbolOut: symbol1 ?? '',
            zapAmountIn: amountIn.toSignificant(6),
            tokenAmountIn: newPosDraft?.amount0?.toSignificant(6) || '0',
            tokenAmountOut: newPosDraft?.amount1?.toSignificant(6) || '0',
            tokenAddressIn: currency0?.wrapped.address || '',
            tokenAddressOut: currency1?.wrapped.address || '',
          },
        })

        setAttempingTx(false)
        mixpanel.track('Zap - Confirmed', {
          token0: selectedCurrency?.symbol,
          token1: quoteCurrency?.symbol,
          zap_token: selectedCurrency?.symbol,
          token_amount: amountIn.toExact(),
          source: tokenId ? 'my_pool_page' : 'pool_page',
        })
      } catch (e) {
        setAttempingTx(false)
        setError(e?.message || JSON.stringify(e))
      }
    }
  }

  const addliquidityLink = `/${networkInfo.route}${
    tokenId ? APP_PATHS.ELASTIC_INCREASE_LIQ : APP_PATHS.ELASTIC_CREATE_POOL
  }/${currency0?.isNative ? currency0.symbol : currency0?.wrapped.address || ''}/${
    currency1?.isNative ? currency1.symbol : currency1?.wrapped.address || ''
  }/${pool?.fee}${tokenId ? `/${tokenId}` : ''}`

  return (
    <Modal isOpen={isOpen}>
      {attempingTx ? (
        <ConfirmationPendingContent
          onDismiss={() => {
            setAttempingTx(false)
          }}
          pendingText={
            <Trans>
              Zapping {amountIn?.toSignificant(6)} {selectedCurrency?.symbol} into{' '}
              {newPosDraft?.amount0?.toSignificant(6)} {symbol0} and {newPosDraft?.amount1?.toSignificant(6)} {symbol1}{' '}
              of liquidity to the pool
            </Trans>
          }
        />
      ) : errorMsg ? (
        <TransactionErrorContent
          onDismiss={() => {
            setError('')
            setAttempingTx(false)
          }}
          message={errorMsg}
        />
      ) : txHash ? (
        <TransactionSubmittedContent chainId={chainId} hash={txHash} onDismiss={onDismiss} />
      ) : (
        <Content>
          {loading ? (
            <LocalLoader />
          ) : (
            <>
              <Overlay overlay={!!expectedChainId && expectedChainId !== chainId}>
                <Flex justifyContent="space-between">
                  <Flex>
                    <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
                    <Text>
                      {symbol0} - {symbol1}
                    </Text>
                  </Flex>

                  {!!position && (
                    <Text fontSize={12} fontWeight="500" color={outOfRange ? theme.warning : theme.primary}>
                      #{tokenId?.toString()}
                    </Text>
                  )}
                </Flex>

                <Text marginTop="12px" color={theme.subText} fontSize={12}>
                  <Trans>Add liquidity to the pool using a single token</Trans>
                </Text>

                {!!position ? (
                  <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                    <Trans>Increase Liquidity</Trans>
                  </Text>
                ) : (
                  <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                    <Trans>Step 1. Deposit Your Liquidity</Trans>
                  </Text>
                )}

                <CurrencyInputPanel
                  id="quick-zap"
                  value={typedValue}
                  onUserInput={v => {
                    setTypedValue(v)
                  }}
                  onMax={() => {
                    setTypedValue(maxAmountSpend(balances[balanceIndex])?.toExact() || '')
                  }}
                  onHalf={() => {
                    setTypedValue(balances[balanceIndex].divide('2').toExact())
                  }}
                  currency={selectedCurrency}
                  estimatedUsd={formattedNum(zapDetail.amountInUsd.toString(), true) || undefined}
                  positionMax="top"
                  showCommonBases
                  isSwitchMode
                  onSwitchCurrency={() => {
                    if (selectedCurrency?.isNative) {
                      setUseWrapped(true)
                    } else {
                      setUseWrapped(false)
                      setIsReverse(prev => !prev)
                    }
                  }}
                />

                {!position && pool && (
                  <>
                    <Flex justifyContent="space-between" alignItems="center" marginTop="20px" marginBottom="12px">
                      <Text fontWeight="500" fontSize={14}>
                        <Trans>Step 2. Choose Price Range</Trans>
                      </Text>

                      <StyledInternalLink to={addliquidityLink}>
                        <Text fontSize="12px" fontWeight="500">
                          <Trans>Set a Custom Range</Trans> ↗
                        </Text>
                      </StyledInternalLink>
                    </Flex>

                    <RangeSelector
                      pool={pool}
                      selectedRange={selectedRange}
                      onChange={range => setSelectedRange(range)}
                      farmV2={farmV2}
                    />
                  </>
                )}

                <div style={{ margin: '20px -8px' }}>
                  <SlippageSettingGroup isWrapOrUnwrap={false} isStablePairSwap={false} />
                </div>

                <ZapDetail zapLoading={zapLoading} zapDetail={zapDetail} />

                {!!(
                  zapDetail.priceImpact?.isVeryHigh ||
                  zapDetail.priceImpact?.isHigh ||
                  zapDetail.priceImpact?.isInvalid
                ) &&
                  result &&
                  !zapLoading && (
                    <>
                      <Flex marginTop="1rem" />
                      {zapDetail.priceImpact.isVeryHigh ? (
                        <WarningNote
                          level="serious"
                          shortText={
                            <Text>
                              <Trans>
                                <TextUnderlineColor
                                  as="a"
                                  href={PRICE_IMPACT_EXPLANATION_URL}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  Price Impact
                                </TextUnderlineColor>{' '}
                                is very high. You will lose funds! Please turn on{' '}
                                <StyledInternalLink to={`${addliquidityLink}?showSetting=true`}>
                                  Degen Mode ↗
                                </StyledInternalLink>
                              </Trans>
                            </Text>
                          }
                        />
                      ) : (
                        <PriceImpactNote priceImpact={zapDetail.priceImpact.value} />
                      )}
                    </>
                  )}
              </Overlay>

              <Flex sx={{ gap: '1rem' }} marginTop="1.25rem">
                <ButtonOutlined
                  onClick={() => {
                    mixpanel.track('Zap - Canceled', {
                      source: tokenId ? 'my_pool_page' : 'pool_page',
                      token0: pool?.token0.symbol,
                      token1: pool?.token1.symbol,
                      zap_token: selectedCurrency?.symbol,
                    })
                    onDismiss()
                  }}
                >
                  <Trans>Cancel</Trans>
                </ButtonOutlined>

                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect</Trans>
                  </ButtonLight>
                ) : expectedChainId && expectedChainId !== chainId ? (
                  <ButtonPrimary onClick={() => changeNetwork(expectedChainId)}>Switch Network</ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    backgroundColor={
                      zapDetail.priceImpact.isVeryHigh
                        ? theme.red
                        : zapDetail.priceImpact.isHigh
                        ? theme.warning
                        : undefined
                    }
                    onClick={handleClick}
                    disabled={
                      !!error ||
                      approvalState === ApprovalState.PENDING ||
                      zapLoading ||
                      zapDetail.priceImpact?.isVeryHigh
                    }
                  >
                    {renderActionName()}
                  </ButtonPrimary>
                )}
              </Flex>
            </>
          )}
        </Content>
      )}
    </Modal>
  )
}
