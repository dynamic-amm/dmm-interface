import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flex } from 'rebass'
import { ChevronUp, Info, Minus, Plus } from 'react-feather'
import { useDispatch } from 'react-redux'
import { t, Trans } from '@lingui/macro'
import { ChainId, Fraction, JSBI, Token } from '@dynamic-amm/sdk'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import CopyHelper from 'components/Copy'
import { usePoolDetailModalToggle } from 'state/application/hooks'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { getMyLiquidity, parseSubgraphPoolData, getTradingFeeAPR, useCheckIsFarmingPool } from 'utils/dmm'
import { setSelectedPool } from 'state/pools/actions'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { MAX_ALLOW_APY } from 'constants/index'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import {
  AddressAndAMPContainer,
  AddressWrapper,
  AMPLiquidityAndTVLContainer,
  APR,
  ButtonWrapper,
  DataText,
  ListItemGroupContainer,
  PoolAddressContainer,
  TableRow,
  TextAMP,
  TextAMPLiquidity,
  TextShowMorePools,
  TextTokenPair,
  TextTVL,
  TokenPairContainer
} from 'components/PoolList/styled'
import { tryParseAmount } from 'state/swap/hooks'
import { getAddress } from '@ethersproject/address'

export interface ListItemGroupProps {
  sortedFilteredSubgraphPoolsObject: Map<string, SubgraphPoolData[]>
  poolData: SubgraphPoolData
  userLiquidityPositions: { [key: string]: UserLiquidityPosition }
  expandedPoolKey: string
  setExpandedPoolKey: React.Dispatch<React.SetStateAction<string>>
}

export interface ListItemProps {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
  isShowExpandedPools: boolean
  isFirstPoolInGroup: boolean
}

const ListItemGroup = ({
  sortedFilteredSubgraphPoolsObject,
  poolData,
  userLiquidityPositions,
  expandedPoolKey,
  setExpandedPoolKey
}: ListItemGroupProps) => {
  const poolKey = poolData.token0.id + '-' + poolData.token1.id

  const isShowExpandedPools = poolKey === expandedPoolKey

  const onUpdateExpandedPoolKey = () => {
    setExpandedPoolKey(prev => (prev === poolKey ? '' : poolKey))
  }

  const [isShowAllExpandedPools, setIsShowAllExpandedPools] = useState(false)

  const expandedPools = sortedFilteredSubgraphPoolsObject.get(poolKey) ?? []

  const renderPools = isShowExpandedPools
    ? isShowAllExpandedPools
      ? expandedPools
      : expandedPools.slice(0, 2)
    : [poolData]

  const isDisableShowMoreButton = expandedPools.length <= 2 || isShowAllExpandedPools

  const onShowAllExpandedPools = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (isDisableShowMoreButton) return
    setIsShowAllExpandedPools(true)
  }

  return (
    <ListItemGroupContainer onClick={onUpdateExpandedPoolKey}>
      {renderPools.map((poolData, index) => (
        <ListItem
          key={poolData.id}
          poolData={poolData}
          myLiquidity={userLiquidityPositions[poolData.id]}
          isShowExpandedPools={isShowExpandedPools}
          isFirstPoolInGroup={index === 0}
        />
      ))}
      {isShowExpandedPools && (
        <TableRow isShowExpandedPools={isShowExpandedPools}>
          <TextShowMorePools disabled={isDisableShowMoreButton} onClick={onShowAllExpandedPools}>
            <Trans>Show more pools</Trans>
          </TextShowMorePools>
        </TableRow>
      )}
    </ListItemGroupContainer>
  )
}

const ListItem = ({ poolData, myLiquidity, isShowExpandedPools, isFirstPoolInGroup }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const togglePoolDetailModal = usePoolDetailModalToggle()

  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(10000))

  const isFarmingPool = useCheckIsFarmingPool(poolData.id)

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(poolData.id, 3)
  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(
    poolData,
    chainId as ChainId
  )
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).add(reserve1.divide(virtualReserve1)))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')
  const volume = poolData.oneDayVolumeUSD ? poolData.oneDayVolumeUSD : poolData.oneDayVolumeUntracked

  const fee = poolData.oneDayFeeUSD ? poolData.oneDayFeeUSD : poolData.oneDayFeeUntracked

  const oneYearFL = getTradingFeeAPR(poolData.reserveUSD, fee).toFixed(2)

  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  const totalValueLocked = formattedNum(`${parseFloat(poolData.reserveUSD)}`, true)

  const onTogglePoolDetailModal = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation()
    dispatch(
      setSelectedPool({
        poolData,
        myLiquidity
      })
    )
    togglePoolDetailModal()
  }

  const theme = useTheme()

  return (
    <TableRow isShowExpandedPools={isShowExpandedPools} isShowBorderBottom={isShowExpandedPools} onClick={() => null}>
      <DataText>
        {isFirstPoolInGroup && (
          <Flex>
            {isShowExpandedPools && <ChevronUp style={{ margin: '-4px 4px 0 0' }} />}
            <TokenPairContainer>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} />
              <TextTokenPair>
                {poolData.token0.symbol} - {poolData.token1.symbol}
              </TextTokenPair>
            </TokenPairContainer>
          </Flex>
        )}
      </DataText>

      <DataText style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '-22px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {isFarmingPool && (
            <div style={{ overflow: 'hidden', borderTopLeftRadius: '8px' }}>
              <MouseoverTooltip text={t`Available for yield farming`}>
                <DropIcon />
              </MouseoverTooltip>
            </div>
          )}
          {isWarning && (
            <div style={{ overflow: 'hidden', borderTopLeftRadius: '8px' }}>
              <MouseoverTooltip text={`One token is close to 0% in the pool ratio. Pool might go inactive.`}>
                <WarningLeftIcon />
              </MouseoverTooltip>
            </div>
          )}
        </div>
        <PoolAddressContainer>
          <AddressAndAMPContainer>
            <AddressWrapper>
              {shortenPoolAddress}
              <CopyHelper toCopy={poolData.id} />
            </AddressWrapper>
            <TextAMP>AMP = {formattedNum(amp.toSignificant(5))}</TextAMP>
          </AddressAndAMPContainer>
        </PoolAddressContainer>
      </DataText>
      <DataText>
        {!poolData ? (
          <Loader />
        ) : (
          <AMPLiquidityAndTVLContainer>
            <TextAMPLiquidity>{ampLiquidity}</TextAMPLiquidity>
            <TextTVL>{totalValueLocked}</TextTVL>
          </AMPLiquidityAndTVLContainer>
        )}
      </DataText>
      <APR>{!poolData ? <Loader /> : `${Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}`}</APR>
      <DataText>{!poolData ? <Loader /> : formattedNum(volume, true)}</DataText>
      <DataText>{!poolData ? <Loader /> : formattedNum(fee, true)}</DataText>
      <DataText>{getMyLiquidity(myLiquidity)}</DataText>
      <ButtonWrapper>
        <ButtonEmpty
          padding="0"
          as={Link}
          to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
          style={{
            background: rgba(theme.primary, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Plus size={16} color={theme.primary} />
        </ButtonEmpty>
        {getMyLiquidity(myLiquidity) !== '-' && (
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
            style={{
              background: rgba(theme.subText, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px'
            }}
          >
            <Minus size={16} />
          </ButtonEmpty>
        )}

        <ButtonEmpty
          padding="0"
          onClick={onTogglePoolDetailModal}
          style={{
            background: rgba(theme.buttonGray, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Info size="16px" color={theme.subText} />
        </ButtonEmpty>
      </ButtonWrapper>
    </TableRow>
  )
}

export default ListItemGroup
