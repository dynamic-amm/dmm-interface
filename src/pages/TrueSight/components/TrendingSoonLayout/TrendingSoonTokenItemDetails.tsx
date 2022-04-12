import React from 'react'
import { Flex } from 'rebass'
import { ButtonOutlined } from 'components/Button'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { Trans } from '@lingui/macro'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { formattedNum } from 'utils'
import { ExternalLink } from 'theme'
import CommunityButton from 'pages/TrueSight/components/CommunityButton'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import { FieldName, FieldValue } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'

const TrendingSoonTokenItemDetails = ({
  tokenData,
  setIsOpenChartModal,
  setFilter,
}: {
  tokenData: TrueSightTokenData
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter?: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}) => {
  return (
    <>
      <Flex style={{ gap: '20px', marginTop: '4px' }}>
        <ButtonOutlined height="36px" fontSize="14px" padding="0" flex="1" onClick={() => setIsOpenChartModal(true)}>
          <BarChartIcon />
          <span style={{ marginLeft: '6px' }}>
            <Trans>View chart</Trans>
          </span>
        </ButtonOutlined>
        <SwapButtonWithOptions
          platforms={tokenData.platforms}
          style={{ flex: 1, padding: 0, minWidth: 'unset' }}
          tokenData={tokenData}
        />
      </Flex>

      <Flex flexDirection="column" style={{ gap: '16px', marginTop: '4px' }}>
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Tag</Trans>
          </FieldName>
          <Tags tags={tokenData.tags} style={{ justifyContent: 'flex-end' }} setFilter={setFilter} />
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Price</Trans>
          </FieldName>
          <FieldValue>{formattedNum(tokenData.price.toString(), true)}</FieldValue>
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Trading Volume (24H)</Trans>
          </FieldName>
          <FieldValue>{formattedNum(tokenData.trading_volume.toString(), true)}</FieldValue>
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Market Cap</Trans>
          </FieldName>
          <FieldValue>
            {tokenData.market_cap <= 0 ? '--' : formattedNum(tokenData.market_cap.toString(), true)}
          </FieldValue>
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Holders</Trans>
          </FieldName>
          <FieldValue>
            {tokenData.number_holders <= 0 ? '--' : formattedNum(tokenData.number_holders.toString(), false)}
          </FieldValue>
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <FieldName>
            <Trans>Website</Trans>
          </FieldName>
          <FieldValue as={ExternalLink} target="_blank" href={tokenData.official_web}>
            <Trans>{tokenData.official_web} ↗</Trans>
          </FieldValue>
        </Flex>
        <Divider />
        <Flex justifyContent="space-between" alignItems="center">
          <CommunityButton communityOption={tokenData.social_urls} />
          <AddressButton platforms={tokenData.platforms} />
        </Flex>
      </Flex>
    </>
  )
}

export default TrendingSoonTokenItemDetails
