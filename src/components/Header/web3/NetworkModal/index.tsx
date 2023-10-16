import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { LegacyRef, ReactNode, forwardRef, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Save, X } from 'react-feather'
import { Button, Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'
import styled from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { TYPE } from 'theme'

import DraggableNetworkButton from './DraggableNetworkButton'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`
const gap = isMobile ? '8px' : '16px'

const NetworkList = styled.div`
  display: flex;
  align-items: center;
  column-gap: ${gap};
  row-gap: 4px;
  flex-wrap: wrap;
  width: 100%;
  & > * {
    width: calc(50% - ${gap} / 2);
  }
`

const DropableZone = forwardRef(function DropableZone(
  { id, children }: { id: string; children: ReactNode },
  ref: LegacyRef<HTMLDivElement>,
) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  return (
    <div
      ref={ref}
      onDragOverCapture={() => setIsDraggingOver(true)}
      style={
        isDraggingOver
          ? {
              backgroundColor: 'red',
            }
          : {} //todo
      }
      id={id}
    >
      {children}
    </div>
  )
})

export default function NetworkModal({
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  isOpen,
  customToggleModal,
  disabledMsg,
}: {
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  isOpen?: boolean
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
}): JSX.Element | null {
  const theme = useTheme()
  const { isWrongNetwork } = useActiveWeb3React()
  const [requestSaveProfile] = useUpdateProfileMutation()
  const { userInfo } = useSessionInfo()

  const [favoriteChains, setFavoriteChains] = useState<string[]>(userInfo?.data?.favouriteChainIds || [])
  const [isEdittingMobile, setIsEdittingMobile] = useState(false)

  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const toggleNetworkModal = customToggleModal || toggleNetworkModalGlobal

  const droppableRefs = useRef<HTMLDivElement[]>([])
  const { supportedChains } = useChainsConfig()

  const handleDrop = (chainId: string, dropId: string) => {
    if (dropId === 'favorite-dropzone') {
      const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
      if (chainInfo && !favoriteChains.includes(chainInfo)) {
        saveFavoriteChains([...favoriteChains, chainInfo.chainId.toString()])
      }
    }
    if (dropId === 'chains-dropzone') {
      if (favoriteChains.some(fChainId => fChainId === chainId)) {
        saveFavoriteChains([...favoriteChains.filter(fChainId => fChainId !== chainId)])
      }
    }
  }

  const handleFavoriteChangeMobile = (chainId: string, isAdding: boolean) => {
    if (isAdding) {
      const chainInfo = supportedChains.find(item => item.chainId.toString() === chainId)
      if (chainInfo && !favoriteChains.includes(chainInfo)) {
        saveFavoriteChains([...favoriteChains, chainInfo.chainId.toString()])
      }
    } else {
      if (favoriteChains.some(fChainId => fChainId === chainId)) {
        saveFavoriteChains([...favoriteChains.filter(fChainId => fChainId !== chainId)])
      }
    }
  }

  const saveFavoriteChains = (chains: string[]) => {
    const uniqueArray = Array.from(new Set(chains))
    requestSaveProfile({ data: { favouriteChainIds: uniqueArray } })
    setFavoriteChains(uniqueArray)
  }

  useEffect(() => {
    setFavoriteChains(userInfo?.data?.favouriteChainIds || [])
  }, [userInfo])

  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : networkModalOpen}
      onDismiss={toggleNetworkModal}
      maxWidth={624}
      zindex={Z_INDEXS.MODAL}
      height="500px"
    >
      <Wrapper>
        <RowBetween>
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </Text>
          <ButtonAction onClick={toggleNetworkModal}>
            <X />
          </ButtonAction>
        </RowBetween>

        <Column marginTop="16px" gap="8px">
          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Favorite Chain(s)</Trans>
            </Text>
            <hr style={{ border: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
            {isMobile &&
              (isEdittingMobile ? (
                <Button
                  fontSize="12px"
                  backgroundColor={theme.primary + '60'}
                  color={theme.primary}
                  padding="4px 6px"
                  flexShrink={0}
                  style={{ borderRadius: '99px' }}
                  onClick={() => setIsEdittingMobile(false)}
                >
                  <RowFit gap="4px">
                    <Save size={14} />
                    <Trans>Save</Trans>
                  </RowFit>
                </Button>
              ) : (
                <Button
                  fontSize="12px"
                  backgroundColor={theme.border}
                  color={theme.subText}
                  padding="4px 6px"
                  flexShrink={0}
                  style={{ borderRadius: '99px' }}
                  onClick={() => setIsEdittingMobile(true)}
                >
                  <Trans>Edit list</Trans>
                </Button>
              ))}
          </Row>
          <DropableZone
            ref={ref => {
              if (ref) {
                droppableRefs.current[0] = ref
              }
            }}
            id="favorite-dropzone"
          >
            {favoriteChains.length === 0 ? (
              <Row border={'1px dashed ' + theme.text + '32'} borderRadius="99px" padding="8px 12px" justify="center">
                <Text fontSize="10px" lineHeight="14px" color={theme.subText}>
                  <Trans>Drag your favourite chain(s) here</Trans>
                </Text>
              </Row>
            ) : (
              <NetworkList>
                {supportedChains
                  .filter(chain => favoriteChains.some(i => i === chain.chainId.toString()))
                  .map((networkInfo: NetworkInfo) => {
                    return (
                      <DraggableNetworkButton
                        key={networkInfo.chainId}
                        droppableRefs={droppableRefs}
                        networkInfo={networkInfo}
                        activeChainIds={activeChainIds}
                        selectedId={selectedId}
                        disabledMsg={disabledMsg}
                        onDrop={(dropId: string) => {
                          handleDrop(networkInfo.chainId.toString(), dropId)
                        }}
                        customToggleModal={customToggleModal}
                        customOnSelectNetwork={customOnSelectNetwork}
                        onChangedNetwork={toggleNetworkModal}
                        isEdittingMobile={isEdittingMobile}
                        onFavoriteClick={() => handleFavoriteChangeMobile(networkInfo.chainId.toString(), false)}
                      />
                    )
                  })}
              </NetworkList>
            )}
          </DropableZone>

          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Chain List</Trans>
            </Text>
            <hr style={{ border: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          {isWrongNetwork && (
            <TYPE.main fontSize={16} marginTop={14}>
              <Trans>Please connect to the appropriate chain.</Trans>
            </TYPE.main>
          )}
          <NetworkList
            ref={ref => {
              if (ref) {
                droppableRefs.current[1] = ref
              }
            }}
            id="chains-dropzone"
          >
            {supportedChains
              .filter(chain => !favoriteChains.some(i => i === chain.chainId.toString()))
              .map((networkInfo: NetworkInfo) => {
                return (
                  <DraggableNetworkButton
                    isAddButton
                    key={networkInfo.chainId}
                    droppableRefs={droppableRefs}
                    networkInfo={networkInfo}
                    activeChainIds={activeChainIds}
                    selectedId={selectedId}
                    disabledMsg={disabledMsg}
                    onDrop={(dropId: string) => {
                      handleDrop(networkInfo.chainId.toString(), dropId)
                    }}
                    customToggleModal={customToggleModal}
                    customOnSelectNetwork={customOnSelectNetwork}
                    onChangedNetwork={toggleNetworkModal}
                    isEdittingMobile={isEdittingMobile}
                    onFavoriteClick={() => handleFavoriteChangeMobile(networkInfo.chainId.toString(), true)}
                  />
                )
              })}
          </NetworkList>
        </Column>
      </Wrapper>
    </Modal>
  )
}
