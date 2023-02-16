import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled, { css, keyframes } from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { AnnouncementTemplatePopup, PopupContentAnnouncement, PopupType } from 'components/Announcement/type'
import Announcement from 'components/Icons/Announcement'
import useTheme from 'hooks/useTheme'
import { useActivePopups, useRemoveAllPopupByType } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const BannerWrapper = styled.div<{ color?: string }>`
  width: 100%;
  padding: 10px 12px 10px 20px;
  background: ${({ theme, color }) => rgba(color ?? theme.warning, 0.7)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  `}
`

const StyledClose = styled(X)`
  color: white;
  :hover {
    cursor: pointer;
  }
`

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    flex: 1;
    width:100%;
  `}
`

const TextWrapper = styled.div`
  margin-left: 4px;
  margin-right: 1rem;
  color: ${({ theme }) => theme.text};
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToSmall`${css`
    max-width: 100%;
    flex: 1;
    height: 20px;
    position: relative;
    margin: 0;
  `}
  `}
`

const marquee = () => keyframes`
  0% { transform: translateX(0%) ; }
  50% { transform: translateX(-110%) ; }
  50.1% { transform: translateX(110%) ; }
  100% { transform: translateX(0%) ; }
`
const TextContent = styled.div<{ overflow: boolean }>`
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  ${({ theme, overflow }) => theme.mediaWidth.upToSmall`
     ${
       overflow &&
       css`
         animation: ${marquee} 15s linear infinite;
       `
     };
    white-space: nowrap;
    position: absolute;
  `}
`
const StyledCtaButton = styled(CtaButton)`
  width: 140px;
  height: 36px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
const StyledLink = styled(ExternalLink)`
  &:hover {
    text-decoration: none;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
function TopBanner() {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { topPopups } = useActivePopups()
  const popupInfo = topPopups[topPopups.length - 1]

  const removeAllPopupByType = useRemoveAllPopupByType()
  const hideBanner = () => removeAllPopupByType(PopupType.TOP_BAR)

  const refContent = useRef<HTMLDivElement>(null)
  const contentNode = refContent.current
  const [isOverflowParent, setIsOverflowParent] = useState(false)

  useEffect(() => {
    if (contentNode?.parentElement) {
      const isOverflowParent = contentNode.clientWidth > contentNode.parentElement?.clientWidth
      setIsOverflowParent(isOverflowParent)
    }
  }, [contentNode])

  if (!popupInfo) return null
  const { templateBody } = popupInfo.content as PopupContentAnnouncement
  const announcement = (templateBody as AnnouncementTemplatePopup).announcement
  if (!announcement) return null
  const { content, ctas = [], type } = announcement

  return (
    <BannerWrapper color={type === 'NORMAL' ? theme.apr : theme.warning}>
      {!isMobile && <div />}
      <Content>
        {!isMobile && <Announcement />}
        <TextWrapper>
          <TextContent ref={refContent} overflow={isOverflowParent}>
            {content}
          </TextContent>
        </TextWrapper>
        {isMobile && <StyledClose size={24} onClick={hideBanner} />}
      </Content>
      <StyledLink href={ctas[0]?.url}>
        <StyledCtaButton data={ctas[0]} color="gray" onClick={hideBanner} />
      </StyledLink>
      {!isMobile && <StyledClose size={24} onClick={hideBanner} style={{ marginLeft: 8 }} />}
    </BannerWrapper>
  )
}

export default TopBanner
