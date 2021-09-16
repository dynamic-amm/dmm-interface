import { ChainId, Currency, Trade, TradeType } from 'libs/sdk/src'
import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE, ExternalLink } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { DMM_ANALYTICS_URL } from '../../constants'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const InfoLink = styled(ExternalLink)`
  width: 100%;
  border-top: 1px solid ${({ theme }) => theme.advancedBorder};
  padding: 16px 6px;
  text-align: center;
  font-size: 12px;
  color: ${({ theme }) => theme.text10};
`

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  const theme = useContext(ThemeContext)
  const { priceImpactWithoutFee, realizedLPFee, accruedFeePercent } = computeTradePriceBreakdown(trade)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)
  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  return (
    <AutoColumn gap="4px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
            {isExactIn ? t`Minimum received` : t`Maximum sold`}
          </TYPE.black>
          <QuestionHelper
            text={t`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
          />
        </RowFixed>
        <RowFixed>
          <TYPE.black color={theme.text1} fontSize={12} fontWeight={400}>
            {isExactIn
              ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${nativeOutput?.symbol}` ?? '-'
              : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${nativeInput?.symbol}` ?? '-'}
          </TYPE.black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
            <Trans>Price Impact</Trans>
          </TYPE.black>
          <QuestionHelper
            text={t`The difference between the market price and your price due to trade size. Adjust the price impact tolerance in the top right configuration.`}
          />
        </RowFixed>
        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
            <Trans>Liquidity Provider Fee</Trans>
          </TYPE.black>
          <QuestionHelper
            text={t`A portion of each trade (${accruedFeePercent.toSignificant(
              6
            )}%) goes to liquidity providers as a protocol incentive.`}
          />
        </RowFixed>
        <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${nativeInput?.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
            <Trans>You Save</Trans>
          </TYPE.black>
          <QuestionHelper
            text={t`A portion of each trade (${accruedFeePercent.toSignificant(
              6
            )}%) goes to liquidity providers as a protocol incentive.`}
          />
        </RowFixed>
        <TYPE.black fontSize={12} fontWeight={400} color={theme.text1}>
          {/* TODO: Update this */}
          300$
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const { chainId } = useActiveWeb3React()
  const [allowedSlippage] = useUserSlippageTolerance()

  return (
    <AutoColumn gap="md">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          <AutoColumn>
            <InfoLink
              href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${trade?.route.pairs[0].liquidityToken.address}`}
              target="_blank"
            >
              <Trans>Token pool analytics →</Trans>
            </InfoLink>
          </AutoColumn>
        </>
      )}
    </AutoColumn>
  )
}
