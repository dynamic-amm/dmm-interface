import { motion } from 'framer-motion'
import { rgba } from 'polished'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as Send } from 'assets/svg/ic_send.svg'
import { ReactComponent as KaiAvatarSvg } from 'assets/svg/kai_avatar.svg'

export const Wrapper = styled(motion.div)`
  position: fixed;
  bottom: 1rem;
  right: 8rem;
  z-index: 1;
  height: 36px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    bottom: 120px;
    right: 1rem;
  `};
`

export const KaiAvatar = styled(KaiAvatarSvg)`
  cursor: pointer;
`

export const Modal = styled(motion.div)`
  position: fixed;
  bottom: 5.2rem;
  right: 1rem;
  z-index: 10;
  font-size: 14px;
  width: fit-content;
  height: fit-content;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    bottom: 174px;
  `}
`

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  padding: 20px 24px 26px;
  border-radius: 12px;
  width: 395px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: calc(100vw - 2rem);
  `}
`

export const KaiHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const KaiHeaderLeft = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`

export const ChainAnchorWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 5px;
`

export const ChainItem = styled.div<{ active: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  color: ${({ theme }) => theme.white};

  ${({ theme, active }) =>
    active &&
    css`
      color: ${theme.subText};
    `}
`

export const SelectedChainImg = styled.img`
  width: 20px;
  height: 20px;
  position: relative;
  left: 6px;
`

export const ChainAnchorBackground = styled.div`
  position: absolute;
  background-color: ${({ theme }) => rgba(theme.white, 0.1)};
  border-radius: 16px;
  top: 0;
  left: 3px;
  width: 190%;
  height: 100%;
`

export const ChainSelectorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  max-height: 155px;
  overflow: auto;
  padding: 6px;
`

export const HeaderTextName = styled.p`
  margin: 0;
`

export const HeaderSubText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.subText};
`

export const Divider = styled.div`
  background-color: #505050;
  height: 1px;
  width: 100%;
  margin: 10px 0 14px;
`

export const ChatWrapper = styled.div<{ disabled: boolean }>`
  position: relative;
  height: 36px;
  margin-top: 16px;

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.4;
    `}
`

export const ChatInput = styled.input`
  position: absolute;
  display: flex;
  padding: 10px 30px 13px 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.background};
  background: ${({ theme }) => theme.background};
  transition: border 100ms;
  appearance: none;
  -webkit-appearance: none;

  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 13.5px;
    ${({ theme }) => theme.mediaWidth.upToSmall`
      font-size: 12.5px;
    `};
  }

  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
    outline: none;
  }
`

export const SendIcon = styled(Send)<{ disabled: boolean }>`
  position: absolute;
  right: 12px;
  top: 12px;
  color: transparent;
  transition: 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    color: ${({ theme }) => theme.primary};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: default;
      color: transparent !important;
    `}
`

export const LoadingWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
`

const loadingKeyFrame = keyframes`
  100%{transform: rotate(.5turn)}
`

export const Loader = styled.div`
  width: 16px;
  aspect-ratio: 1;
  --c: ${({ theme }) => `no-repeat radial-gradient(farthest-side, ${theme.subText} 92%, #0000)`};
  background: var(--c) 50% 0, var(--c) 50% 100%, var(--c) 100% 50%, var(--c) 0 50%;
  background-size: 3px 3px;
  animation: ${loadingKeyFrame} 1s infinite;
  position: relative;

  ::before {
    content: '';
    position: absolute;
    inset: 0;
    margin: 1px;
    background: ${({ theme }) => `repeating-conic-gradient(#0000 0 35deg, ${theme.subText} 0 90deg)`};
    mask: radial-gradient(farthest-side, #0000 calc(100% - 1px), #000 0);
    -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 1px), #000 0);
    border-radius: 50%;
  }
`

export const ChatPanel = styled.div`
  max-height: 415px;
  overflow: scroll;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    max-height: 50vh;
  `}
`

export const ActionPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
`

export const ActionButton = styled.div<{ width: string; disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #fafafa;
  height: 36px;
  background-color: ${({ theme }) => rgba(theme.white, 0.04)};
  transition: 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => rgba(theme.white, 0.08)};
  }

  ${({ width, disabled, theme }) =>
    css`
      width: ${width};
      ${disabled &&
      `
        background-color: ${rgba(theme.disableText, 0.4)} !important;
        cursor: not-allowed;
      `}
    `}
`

export const MainActionButton = styled(ActionButton)<{ disabled: boolean }>`
  background-color: ${({ theme }) => rgba(theme.primary, 0.1)};

  :hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.18)};
  }

  ${({ disabled, theme }) =>
    css`
      ${disabled &&
      `
        background-color: ${rgba(theme.disableText, 0.4)} !important;
        cursor: not-allowed;
      `}
    `}
`

export const ActionText = styled.div`
  margin-top: 16px;
`

export const UserMessageWrapper = styled.div<{ havePrevious: boolean }>`
  margin-top: 16px;
  width: 100%;
  display: flex;
  justify-content: flex-end;

  ${({ havePrevious }) =>
    havePrevious &&
    css`
      margin-top: 4px;
    `}
`

export const UserMessage = styled.p<{ havePrevious: boolean; haveFollowing: boolean }>`
  margin: 0;
  background-color: ${({ theme }) => theme.darkerGreen};
  width: fit-content;
  border-radius: 16px;
  padding: 8px 12px;
  max-width: 100%;
  word-wrap: break-word;

  ${({ havePrevious, haveFollowing }) =>
    css`
      border-top-right-radius: ${havePrevious ? 4 : 16}px;
      border-bottom-right-radius: ${haveFollowing ? 4 : 16}px;
    `}
`
