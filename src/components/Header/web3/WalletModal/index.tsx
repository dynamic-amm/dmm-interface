import { Trans } from '@lingui/macro'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { UnsupportedChainIdError } from '@web3-react/core'
import { transparentize } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { AutoColumn } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import AccountDetails from 'components/Header/web3/AccountDetails'
import Networks from 'components/Header/web3/NetworkModal/Networks'
import WarningIcon from 'components/Icons/WarningIcon'
import Modal from 'components/Modal'
import { AutoRow, RowFixed } from 'components/Row'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useActivationWallet } from 'hooks/useActivationWallet'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import usePrevious from 'hooks/usePrevious'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenNetworkModal, useWalletModalToggle } from 'state/application/hooks'
import { useIsAcceptedTerm, useIsUserManuallyDisconnect } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isEVMWallet, isOverriddenWallet, isSolanaWallet } from 'utils'

import Option from './Option'
import PendingView from './PendingView'

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 16px;
  padding: 8px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const HeaderRow = styled.div<{ padding?: string }>`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: ${({ padding }) => padding ?? '30px 24px 0 24px'};
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1.5rem 1rem 1rem;
  `};
`

const ContentWrapper = styled.div<{ padding?: string }>`
  padding: ${({ padding }) => padding ?? '24px'};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const TermAndCondition = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 28px 24px 0px 24px;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
  accent-color: ${({ theme }) => theme.primary};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
  `};
`

const HoverText = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 20px;
  :hover {
    cursor: pointer;
  }
`

const ToSText = styled.span`
  color: ${({ theme }) => theme.text9};
  font-weight: 500;
`

const WALLET_VIEWS = {
  CHANGE_WALLET: 'CHANGE_WALLET',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  const { account, isSolana, isEVM } = useActiveWeb3React()
  // important that these are destructed from the account-specific web3-react context
  const { active, connector, error } = useWeb3React()
  const { connected, connecting, wallet: solanaWallet } = useWallet()
  const { tryActivation } = useActivationWallet()

  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()

  const theme = useTheme()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWalletKey, setPendingWalletKey] = useState<SUPPORTED_WALLET | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const openNetworkModal = useOpenNetworkModal()

  const previousAccount = usePrevious(account)

  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const location = useLocation()
  const { mixpanelHandler } = useMixpanel()

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      if (location.pathname.startsWith('/campaigns')) {
        mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_WALLET_CONNECTED)
      }
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen, location.pathname, mixpanelHandler])

  useEffect(() => {
    if (error && error instanceof UnsupportedChainIdError) {
      openNetworkModal()
    }
  }, [error, openNetworkModal])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)

  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  useEffect(() => {
    // If is there any issue when connecting wallet, solanaWallet will be cleared and set to null
    // Use it to check is there any error after connecting
    if (!connecting && !connected && !solanaWallet) {
      setPendingError(true)
    }
  }, [connecting, connected, solanaWallet])

  const handleWalletChange = useCallback(
    async (walletKey: SUPPORTED_WALLET) => {
      setPendingWalletKey(walletKey)
      setWalletView(WALLET_VIEWS.PENDING)
      setPendingError(false)
      try {
        await tryActivation(walletKey)
        setIsUserManuallyDisconnect(false)
      } catch {
        setPendingError(true)
      }
    },
    [setIsUserManuallyDisconnect, tryActivation],
  )

  function getOptions() {
    // Generate list of wallets and states of it depend on current network
    const parsedWalletList = Object.keys(SUPPORTED_WALLETS).map((k: string) => {
      const wallet = SUPPORTED_WALLETS[k]
      const readyState = (() => {
        const readyStateEVM = isEVMWallet(wallet) ? wallet.readyState() : undefined
        const readyStateSolana = isSolanaWallet(wallet) ? wallet.readyStateSolana() : undefined
        return (isEVM && readyStateEVM) || (isSolana && readyStateSolana) || readyStateEVM || readyStateSolana
      })()
      const isSupportCurrentChain = (isEVMWallet(wallet) && isEVM) || (isSolanaWallet(wallet) && isSolana) || false
      const overridden = isOverriddenWallet(k)
      return {
        ...wallet,
        key: k,
        readyState,
        isSupportCurrentChain,
        isOverridden: overridden,
      }
    })

    const sortWallets = (walletA: any, walletB: any) => {
      if (walletA.isSupportCurrentChain === walletB.isSupportCurrentChain) {
        if (walletA.isOverridden === walletB.isOverridden) {
          if (walletA.readyState === walletB.readyState) {
            return 0
          } else {
            // Wallet installed will have higher priority
            if (
              walletA.readyState === WalletReadyState.Installed ||
              (walletA.readyState === WalletReadyState.Loadable && walletB.readyState === WalletReadyState.NotDetected)
            )
              return -1
            return 1
          }
        }
        // Wallet not be overridden will have higher priority
        if (!walletA.isOverridden) return -1
        return 1
      } else {
        // Current chain supported wallet higher priority
        if (walletA.isSupportCurrentChain) return -1
        return 1
      }
    }

    return (
      parsedWalletList
        .sort(sortWallets)
        // Filter Unsupported state wallets
        .filter(wallet => wallet.readyState !== WalletReadyState.Unsupported)
        .map(wallet => (
          <Option
            key={wallet.key}
            walletKey={wallet.key}
            onSelected={handleWalletChange}
            isSupportCurrentChain={wallet.isSupportCurrentChain}
            readyState={wallet.readyState}
          />
        ))
    )
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow padding="1rem">
            <Trans>Error connecting</Trans>
          </HeaderRow>
          <ContentWrapper padding="1rem 1.5rem 1.5rem">
            <Trans>Error connecting. Try refreshing the page.</Trans>
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.CHANGE_WALLET)}
        />
      )
    }

    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        <HeaderRow>
          {(walletView === WALLET_VIEWS.CHANGE_WALLET || walletView === WALLET_VIEWS.PENDING) && (
            <HoverText
              onClick={() => {
                setPendingError(false)
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }}
              style={{ marginRight: '1rem' }}
            >
              <ChevronLeft color={theme.primary} />
            </HoverText>
          )}
          <HoverText>
            {walletView === WALLET_VIEWS.ACCOUNT ? (
              <Trans>Connect your Wallet</Trans>
            ) : walletView === WALLET_VIEWS.CHANGE_WALLET ? (
              <Trans>Change Wallet</Trans>
            ) : (
              <Trans>Connecting Wallet</Trans>
            )}
          </HoverText>
        </HeaderRow>
        {(walletView === WALLET_VIEWS.ACCOUNT || walletView === WALLET_VIEWS.CHANGE_WALLET) && (
          <TermAndCondition>
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => setIsAcceptedTerm(!isAcceptedTerm)}
              style={{ marginRight: '12px' }}
            />
            <ToSText>
              <Trans>Accept</Trans>{' '}
              <ExternalLink href="/15022022KyberSwapTermsofUse.pdf">
                <Trans>Terms of Use</Trans>
              </ExternalLink>{' '}
              <Trans>and</Trans>{' '}
              <ExternalLink href="http://files.dmm.exchange/privacy.pdf">
                <Trans>Privacy Policy</Trans>
              </ExternalLink>
            </ToSText>
          </TermAndCondition>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              walletKey={pendingWalletKey}
              hasError={pendingError}
              onClickTryAgain={() => {
                pendingWalletKey && tryActivation(pendingWalletKey)
              }}
              context={
                pendingWalletKey === 'SOLFLARE' ? (
                  <div
                    style={{
                      backgroundColor: theme.background,
                      borderRadius: '16px',
                      color: theme.subText,
                      padding: '12px',
                      marginTop: '24px',
                    }}
                  >
                    <ExpandableBox
                      backgroundColor={theme.buttonBlack}
                      headerContent={
                        <AutoRow>
                          <Flex style={{ padding: '0 8px' }}>
                            <WarningIcon />
                          </Flex>
                          <Text style={{ flex: 1, padding: '0 2px' }}>
                            <Trans>
                              If you haven&lsquo;t created a Solflare wallet yet, please follow the steps below
                            </Trans>
                          </Text>
                        </AutoRow>
                      }
                      expandContent={
                        <AutoColumn gap="6px">
                          <RowFixed>
                            <Flex
                              alignItems="center"
                              justifyContent="center"
                              style={{
                                backgroundColor: transparentize(0.8, theme.primary),
                                color: theme.primary,
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                margin: '0 8px',
                                fontSize: '12px',
                              }}
                            >
                              1
                            </Flex>
                            <Text>
                              <Trans>Create a Solflare wallet</Trans>
                            </Text>
                          </RowFixed>
                          <RowFixed>
                            <Flex
                              alignItems="center"
                              justifyContent="center"
                              style={{
                                backgroundColor: transparentize(0.8, theme.primary),
                                color: theme.primary,
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                margin: '0 8px',
                                fontSize: '12px',
                              }}
                            >
                              2
                            </Flex>
                            <Text>
                              <Trans>Close the Solflare popup</Trans>
                            </Text>
                          </RowFixed>
                          <RowFixed>
                            <Flex
                              alignItems="center"
                              justifyContent="center"
                              style={{
                                backgroundColor: transparentize(0.8, theme.primary),
                                color: theme.primary,
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                margin: '0 8px',
                                fontSize: '12px',
                              }}
                            >
                              3
                            </Flex>
                            <Text>
                              <Trans>Try to connect again</Trans>
                            </Text>
                          </RowFixed>
                        </AutoColumn>
                      }
                    />
                  </div>
                ) : undefined
              }
            />
          ) : (
            <>
              <Trans>Select a Network</Trans>
              <Networks width={5} mt={16} mb={24} isAcceptedTerm={isAcceptedTerm} />
              <Trans>Select a Wallet</Trans>
              <OptionGrid>{getOptions()}</OptionGrid>
            </>
          )}
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={false}
      maxHeight={90}
      width={walletView === WALLET_VIEWS.ACCOUNT || walletView === WALLET_VIEWS.CHANGE_WALLET ? 'unset' : undefined}
      maxWidth={account && walletView === WALLET_VIEWS.ACCOUNT ? 544 : 752}
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}
