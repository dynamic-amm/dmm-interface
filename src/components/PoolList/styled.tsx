import styled from 'styled-components'
import { Flex } from 'rebass'
import { MoreHorizontal } from 'react-feather'

export const ListItemGroupContainer = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.bg14}`};
`

export const TableRow = styled.div<{ isShowExpandedPools?: boolean; isShowBorderBottom?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 1fr 1.5fr 1fr 1fr 1fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  background-color: ${({ theme, isShowExpandedPools }) => (isShowExpandedPools ? theme.evenRow : theme.oddRow)};
  position: relative;
  cursor: pointer;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 86.36%; // 100% - (1.5fr / grid-template-columns)
    border-bottom: ${({ theme, isShowBorderBottom }) => (isShowBorderBottom ? `1px dashed ${theme.bg14}` : 'none')};
  }
`

export const GridItem = styled.div<{ noBorder?: boolean }>`
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

export const TradeButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  grid-column: 1 / span 3;
`

export const TradeButtonText = styled.span`
  font-size: 14px;
`

export const DataTitle = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${({ theme }) => theme.text6};

  &:hover {
    opacity: 0.6;
  }

  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
`

export const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

export const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export const StyledMoreHorizontal = styled(MoreHorizontal)`
  color: ${({ theme }) => theme.text9};
`

export const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

export const APR = styled(DataText)`
  color: ${({ theme }) => theme.apr};
`

export const AddressAndAMPContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const AddressWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: baseline;
`

export const TextAMP = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const TokenPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const TextTokenPair = styled.div``

export const TextAMPLiquidity = styled.div``

export const AMPLiquidityAndTVLContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const TextTVL = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const TextShowMorePools = styled.div<{ disabled: boolean }>`
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.primary};
  grid-column: 2 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;

  ${({ disabled }) => (disabled ? `opacity: 0.5;` : ``)}

  &:hover {
    ${({ disabled }) => (!disabled ? `opacity: 0.7;` : ``)}
  }
`

export const ChevronContainer = styled.div`
  margin-left: 8px;
`

export const StyledItemCard = styled.div`
  border-radius: 8px;
  padding: 28px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  min-width: 392px;

  ${({ theme }) => theme.mediaWidth.upToXL`
  `}
`

export const HeaderContainer = styled.div`
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr auto;
  gap: 4px;
`

export const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  line-height: 24px;
`

export const HeaderAMPAndAddress = styled.div`
  display: flex;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  grid-column: 1 / 1;
  grid-row: 2 / 2;
  line-height: 16px;
`

export const HeaderLogo = styled.div`
  grid-column: 2 / 2;
  grid-row: 1 / -1;
  margin-right: -8px; // Pull over the margin-right of DoubleCurrencyLogo
  display: flex;
  align-items: center;
`

export const TokenRatioContainer = styled.div`
  background: ${({ theme }) => theme.bg3};
  position: relative;
  overflow: hidden;
  border-radius: 24px;
`

export const TokenRatioGrid = styled.div`
  padding: 8px;
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  grid-template-rows: 1fr;
  gap: 8px;
  isolation: isolate;
`

export const Progress = styled.div<{ value: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ value }) => value + '%'};
  background: ${({ theme }) => theme.bg12};
`

export const TokenRatioName = styled.div`
  font-size: 14px;
  font-weight: 500;
`

export const TokenRatioPercent = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

export const TabContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.bg12};
  border-radius: 20px;
  display: flex;
  cursor: pointer;
`

export const TabItem = styled.div<{ active?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, active }) => (active ? theme.text14 : theme.subText)};
  background: ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 18px;
  border-radius: 20px;
`

export const InformationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const ButtonGroupContainer = styled.div`
  display: flex;
  gap: 16px;

  > * {
    flex: 1;
  }
`

export const FooterContainer = styled.div``
