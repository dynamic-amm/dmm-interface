import { AbstractConnector } from '@web3-react/abstract-connector'
import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import Option from './Option'
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import { darken } from 'polished'
import Loader from '../Loader'
import { useIsDarkMode } from '../../state/user/hooks'
import { WarningBox } from './WarningBox'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

const LoadingMessage = styled.div<{ error?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 12px;
  margin-bottom: 20px;
  color: ${({ theme, error }) => (error ? theme.red1 : 'inherit')};
  border: 1px solid ${({ theme, error }) => (error ? theme.red1 : theme.text4)};

  & > * {
    padding: 1rem;
  }
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.bg4};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.text4)};
  }
`

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
`

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation,
}: {
  connector?: AbstractConnector
  error?: boolean
  setPendingError: (error: boolean) => void
  tryActivation: (connector: AbstractConnector) => void
}) {
  const isMetamask = window?.ethereum?.isMetaMask
  const isCoin98 = window?.ethereum?.isCoin98 || !!window.coin98
  const isDarkMode = useIsDarkMode()

  const option = Object.keys(SUPPORTED_WALLETS).find(key => {
    const wallet = SUPPORTED_WALLETS[key]
    return wallet.connector === connector
  })

  return (
    <PendingSection>
      <LoadingMessage error={error}>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <div>
                <Trans>Error connecting.</Trans>
              </div>
              <ErrorButton
                onClick={() => {
                  setPendingError(false)
                  connector && tryActivation(connector)
                }}
              >
                <Trans>Try Again</Trans>
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              <Trans>Initializing...</Trans>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
      {Object.keys(SUPPORTED_WALLETS).map(key => {
        const option = SUPPORTED_WALLETS[key]
        if (option.connector === connector) {
          if (option.connector === injected) {
            if (isMetamask && option.name !== 'MetaMask') {
              return null
            }
            if (!isMetamask && option.name === 'MetaMask') {
              return null
            }
          }
          return (
            <Option
              id={`connect-${key}`}
              key={key}
              clickable={false}
              color={option.color}
              header={option.name}
              icon={require(`../../assets/images/${isDarkMode ? '' : 'light-'}${option.iconName}`)}
            />
          )
        }
        return null
      })}
      {isMetamask && isCoin98 && <WarningBox option={option} />}
    </PendingSection>
  )
}
