import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { APP_PATHS } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { isInEnum } from 'utils/string'

import { PoolClassicIcon, PoolElasticIcon } from './Icons'
import { MouseoverTooltip } from './Tooltip'

function ClassicElasticTab() {
  const theme = useTheme()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isFarmPage = location.pathname.startsWith(APP_PATHS.FARMS)

  const { positions, farmPositions } = useElasticLegacy(false)
  const { claimInfo } = useElasticCompensationData(false)
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length

  const params = Object.fromEntries(searchParams)
  const { tab: tabQs = VERSION.ELASTIC, ...qs } = params
  const tab = isInEnum(tabQs, VERSION) ? tabQs : VERSION.ELASTIC

  const { chainId } = useActiveWeb3React()
  const notSupportedElasticMsg = ELASTIC_NOT_SUPPORTED()[chainId]
  const notSupportedClassicMsg = CLASSIC_NOT_SUPPORTED()[chainId]

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const dontShowLegacy = [
    ChainId.ZKEVM,
    ChainId.BASE,
    ChainId.LINEA,
    ChainId.SCROLL,
    ChainId.BLAST,
    ChainId.MANTLE,
    ChainId.XLAYER,
  ].includes(chainId)

  const showLegacyExplicit =
    upToMedium || dontShowLegacy ? false : isFarmPage ? shouldShowFarmTab : shouldShowPositionTab

  useEffect(() => {
    if (dontShowLegacy && tab === VERSION.ELASTIC_LEGACY) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      setSearchParams(newQs)
    }
  }, [tab, dontShowLegacy, setSearchParams, qs])

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
    if (!!notSupportedClassicMsg && version === VERSION.CLASSIC) return
    if (!!notSupportedElasticMsg && version !== VERSION.CLASSIC) return
    const newQs = { ...qs, tab: version }
    setSearchParams(newQs)
  }

  const getColorOfElasticTab = () => {
    if (!!notSupportedElasticMsg) {
      return theme.disableText
    }

    if (!showLegacyExplicit) {
      if ([VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab)) {
        return theme.primary
      }

      return theme.subText
    }

    if (tab === VERSION.ELASTIC) {
      return theme.primary
    }

    return theme.subText
  }

  const getColorOfClassicTab = () => {
    if (!!notSupportedClassicMsg) {
      return theme.disableText
    }

    if (tab === VERSION.CLASSIC) {
      return theme.primary
    }
    return theme.subText
  }

  const getColorOfLegacyElasticTab = () => {
    if (!!notSupportedElasticMsg) {
      return theme.disableText
    }

    return tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText
  }

  const color = getColorOfElasticTab()
  const legacyElasticColor = getColorOfLegacyElasticTab()

  useEffect(() => {
    if (!!notSupportedClassicMsg && !!notSupportedElasticMsg) {
      return
    }
    if (!!notSupportedClassicMsg && tab === VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      setSearchParams(newQs)
    } else if (!!notSupportedElasticMsg && tab !== VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.CLASSIC }
      setSearchParams(newQs)
    }
  }, [setSearchParams, notSupportedElasticMsg, notSupportedClassicMsg, qs, tab])

  return (
    <Flex width="max-content">
      <MouseoverTooltip
        width="fit-content"
        placement="bottom"
        text={
          notSupportedElasticMsg ||
          (dontShowLegacy ? (
            ''
          ) : !showLegacyExplicit ? (
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
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
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
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
                {legacyTag(true)}
              </Flex>
            </Flex>
          ) : null)
        }
      >
        <Flex
          alignItems={'center'}
          onClick={() => {
            if (isMobile) {
              if (showLegacyExplicit || dontShowLegacy) handleSwitchTab(VERSION.ELASTIC)
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
              cursor: !!notSupportedElasticMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </Text>

          {!showLegacyExplicit && tab === VERSION.ELASTIC_LEGACY && legacyTag()}

          {!dontShowLegacy && !showLegacyExplicit && <DropdownSVG style={{ color }} />}
        </Flex>
      </MouseoverTooltip>
      <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
        |
      </Text>

      {showLegacyExplicit && (
        <>
          <MouseoverTooltip text={notSupportedElasticMsg || ''} placement="top">
            <Flex
              sx={{ position: 'relative' }}
              alignItems={'center'}
              onClick={() => {
                handleSwitchTab(VERSION.ELASTIC_LEGACY)
              }}
            >
              <PoolElasticIcon size={20} color={legacyElasticColor} />
              <Text
                fontWeight={500}
                fontSize={[18, 20, 24]}
                color={legacyElasticColor}
                width={'auto'}
                marginLeft="4px"
                role="button"
                style={{
                  cursor: !!notSupportedElasticMsg ? 'not-allowed' : 'pointer',
                }}
              >
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </Text>
              {legacyTag()}
            </Flex>
          </MouseoverTooltip>
          <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
            |
          </Text>
        </>
      )}

      <MouseoverTooltip text={notSupportedClassicMsg || ''}>
        <Flex
          alignItems={'center'}
          onClick={() => {
            handleSwitchTab(VERSION.CLASSIC)
          }}
        >
          <PoolClassicIcon size={20} color={getColorOfClassicTab()} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={getColorOfClassicTab()}
            width={'auto'}
            marginLeft="4px"
            style={{ cursor: 'pointer' }}
            role="button"
          >
            {isFarmPage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
          </Text>
        </Flex>
      </MouseoverTooltip>
    </Flex>
  )
}

export default ClassicElasticTab
