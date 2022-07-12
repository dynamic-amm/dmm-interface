import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'
import { Trans, t } from '@lingui/macro'

import QuestionHelper from 'components/QuestionHelper'
import Modal from 'components/Modal'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Toggle from 'components/Toggle'
import { useExpertModeManager } from 'state/user/hooks'
import useTheme from 'hooks/useTheme'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 24px 28px;
  background-color: ${({ theme }) => theme.background};
`

const StyledInput = styled.input`
  margin-top: 24px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 16px;
  outline: none;
  color: ${({ theme }) => theme.text};
  border: none;
  &::placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`

const StyledCloseIcon = styled(X)`
  height: 28px;
  width: 28px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const AdvancedModeSetting = () => {
  const theme = useTheme()

  const [expertMode, toggleExpertMode] = useExpertModeManager()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleToggleAdvancedMode = () => {
    if (expertMode /* is already ON */) {
      toggleExpertMode()
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    if (confirmText === 'confirm') {
      toggleExpertMode()
      setConfirmText('')
      setShowConfirmation(false)
    }
  }

  return (
    <>
      <Flex justifyContent="space-between">
        <Flex width="fit-content" alignItems="center">
          <span className="settingLabel">
            <Trans>Advanced Mode</Trans>
          </span>
          <QuestionHelper text={t`Enables high slippage trades. Use at your own risk`} />
        </Flex>
        <Toggle id="toggle-expert-mode-button" isActive={expertMode} toggle={handleToggleAdvancedMode} />
      </Flex>

      <Modal
        isOpen={showConfirmation}
        onDismiss={() => {
          setConfirmText('')
          setShowConfirmation(false)
        }}
        maxHeight={100}
      >
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontSize="20px" fontWeight={500}>
              <Trans>Are you sure?</Trans>
            </Text>

            <StyledCloseIcon onClick={() => setShowConfirmation(false)} />
          </Flex>

          <Text marginTop="28px">
            <Trans>
              <Text color={theme.warning} as="span" fontWeight="500">
                Advanced Mode
              </Text>{' '}
              turns off the &apos;Confirm&apos; transaction prompt and allows high slippage trades that can result in
              bad rates and lost funds.
            </Trans>
          </Text>

          <Text marginTop="24px">
            <Trans>Please type the word &apos;confirm&apos; below to enable Advanced Mode</Trans>
          </Text>

          <StyledInput
            placeholder="Confirm"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
          />

          <Text color={theme.disableText} marginTop="8px" fontSize="10px">
            <Trans>Use this mode if you are aware of the risks</Trans>
          </Text>

          <Flex sx={{ gap: '12px' }} marginTop="28px">
            <ButtonPrimary
              style={{
                border: 'none',
                background: theme.warning,
                fontSize: '18px',
              }}
              onClick={handleConfirm}
            >
              <Trans>Confirm</Trans>
            </ButtonPrimary>
            <ButtonOutlined
              onClick={() => {
                setConfirmText('')
                setShowConfirmation(false)
              }}
              style={{ fontSize: '18px' }}
            >
              <Trans>Cancel</Trans>
            </ButtonOutlined>
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  )
}

export default AdvancedModeSetting
