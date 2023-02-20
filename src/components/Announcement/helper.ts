import { useCallback } from 'react'
import { useLocalStorage } from 'react-use'

import { AnnouncementTemplatePopup, PopupContentAnnouncement } from 'components/Announcement/type'
import { PopupItemType } from 'state/application/reducer'

export const useAckAnnouncement = () => {
  const [announcementsMap, setAnnouncementsMap] = useLocalStorage<{ [id: string]: string }>('ack-announcements', {})
  const ackAnnouncement = useCallback(
    (id: string | number) =>
      setAnnouncementsMap({
        ...announcementsMap,
        [id]: '1',
      }),
    [announcementsMap, setAnnouncementsMap],
  )
  return { announcementsAckMap: announcementsMap ?? {}, ackAnnouncement }
}

export const formatNumberOfUnread = (num: number) => (num > 10 ? '10+' : num)

export const isPopupExpired = (popupInfo: PopupItemType, announcementsAckMap: { [id: string]: string }) => {
  const { templateBody, metaMessageId } = popupInfo.content as PopupContentAnnouncement
  const { endAt, startAt } = templateBody as AnnouncementTemplatePopup
  return announcementsAckMap[metaMessageId] || Date.now() < startAt * 1000 || Date.now() > endAt * 1000
}

export const formatTime = (time: number) => {
  const delta = (Date.now() - time * 1000) / 1000
  const min = Math.floor(delta / 60)
  if (min < 1) return `< 1 minute ago`
  if (min < 60) return `${min} minutes ago`
  const hour = Math.floor(delta / 3600)
  if (hour < 24) return `${hour} hours ago`
  const day = Math.floor(delta / (24 * 3600))
  return `${day} days ago`
}
