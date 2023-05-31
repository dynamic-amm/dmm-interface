import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { isMobile } from 'react-device-detect'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { isInEnum } from 'utils/string'

import { PoolClassicIcon, PoolElasticIcon } from './Icons'
import { MouseoverTooltip } from './Tooltip'

function ClassicElasticTab() {
  const { positions, farmPositions } = useElasticLegacy(false)
  const { claimInfo } = useElasticCompensationData(false)
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length

  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()

  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC

  const { chainId } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isFarmpage = location.pathname.includes('/farms')

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const showLegacyExplicit = upToMedium ? false : isFarmpage ? shouldShowFarmTab : shouldShowPositionTab

  const legacyTag = (small?: boolean) => (
    <Text
      sx={{
        fontSize: small ? '10px' : '14px',
        fontWeight: '500',
        padding: '2px 8px',
        borderRadius: '999px',
        color: tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText,
        background: tab === VERSION.ELASTIC_LEGACY ? rgba(theme.primary, 0.2) : rgba(theme.subText, 0.2),
        marginTop: small ? 0 : '-12px',
        marginLeft: '2px',
        lineHeight: 1.5,
      }}
    >
      Legacy
    </Text>
  )

  const handleSwitchTab = (version: VERSION) => {
    if (!!notSupportedMsg) return
    const newQs = { ...qs, tab: version }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const color = !showLegacyExplicit
    ? [VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab)
      ? !!notSupportedMsg
        ? theme.disableText
        : theme.primary
      : theme.subText
    : tab === VERSION.ELASTIC
    ? !!notSupportedMsg
      ? theme.disableText
      : theme.primary
    : theme.subText

  return (
    <Flex width="max-content">
      <MouseoverTooltip
        width="fit-content"
        placement="bottom"
        text={
          notSupportedMsg ||
          (!showLegacyExplicit ? (
            <Flex flexDirection="column" sx={{ gap: '16px', padding: '8px' }}>
              <Flex
                role="button"
                color={tab === VERSION.ELASTIC ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontSize="14px"
                fontWeight={500}
                onClick={() => handleSwitchTab(VERSION.ELASTIC)}
              >
                <PoolElasticIcon size={16} />
                {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </Flex>

              <Flex
                role="button"
                color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontWeight={500}
                fontSize="14px"
                onClick={() => handleSwitchTab(VERSION.ELASTIC_LEGACY)}
              >
                <PoolElasticIcon size={16} />
                {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
                {legacyTag(true)}
              </Flex>
            </Flex>
          ) : null)
        }
        noArrow={!showLegacyExplicit}
      >
        <Flex
          alignItems={'center'}
          onClick={() => {
            if (isMobile) {
              if (showLegacyExplicit) handleSwitchTab(VERSION.ELASTIC)
            } else handleSwitchTab(VERSION.ELASTIC)
          }}
        >
          <PoolElasticIcon size={20} color={color} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={color}
            width={'auto'}
            marginLeft="4px"
            role="button"
            style={{
              cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </Text>

          {!showLegacyExplicit && tab === VERSION.ELASTIC_LEGACY && legacyTag()}

          {!showLegacyExplicit && <DropdownSVG style={{ color }} />}
        </Flex>
      </MouseoverTooltip>
      <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
        |
      </Text>

      {showLegacyExplicit && (
        <>
          <MouseoverTooltip text={notSupportedMsg || ''}>
            <Flex
              sx={{ position: 'relative' }}
              alignItems={'center'}
              onClick={() => {
                if (!!notSupportedMsg) return
                const newQs = { ...qs, tab: VERSION.ELASTIC_LEGACY }
                navigate({ search: stringify(newQs) }, { replace: true })
              }}
            >
              <PoolElasticIcon size={20} color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText} />
              <Text
                fontWeight={500}
                fontSize={[18, 20, 24]}
                color={
                  tab === VERSION.ELASTIC_LEGACY
                    ? !!notSupportedMsg
                      ? theme.disableText
                      : theme.primary
                    : theme.subText
                }
                width={'auto'}
                marginLeft="4px"
                role="button"
                style={{
                  cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
                }}
              >
                {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </Text>
              {legacyTag()}
            </Flex>
          </MouseoverTooltip>
          <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
            |
          </Text>
        </>
      )}

      <Flex
        alignItems={'center'}
        onClick={() => {
          const newQs = { ...qs, tab: VERSION.CLASSIC }
          navigate({ search: stringify(newQs) }, { replace: true })
        }}
      >
        <PoolClassicIcon size={20} color={tab === VERSION.CLASSIC ? theme.primary : theme.subText} />
        <Text
          fontWeight={500}
          fontSize={[18, 20, 24]}
          color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
          width={'auto'}
          marginLeft="4px"
          style={{ cursor: 'pointer' }}
          role="button"
        >
          {isFarmpage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
        </Text>
      </Flex>
    </Flex>
  )
}

export default ClassicElasticTab
