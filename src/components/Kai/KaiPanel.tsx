import { ChainId } from '@kyberswap/ks-sdk-core'
import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Flex } from 'rebass'
import { useGetQuoteByChainQuery } from 'services/marketOverview'

import { ReactComponent as KaiAvatar } from 'assets/svg/kai_avatar.svg'
import NavGroup from 'components/Header/groups/NavGroup'
import { DropdownTextAnchor } from 'components/Header/styleds'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

import { ActionType, KAI_ACTIONS, KaiAction, KaiOption } from './actions'
import {
  ActionButton,
  ActionPanel,
  ActionText,
  ChainAnchorBackground,
  ChainAnchorWrapper,
  ChainItem,
  ChainSelectorWrapper,
  ChatInput,
  ChatPanel,
  ChatWrapper,
  Divider,
  HeaderSubText,
  HeaderTextName,
  KaiHeaderLeft,
  KaiHeaderWrapper,
  Loader,
  LoadingWrapper,
  MainActionButton,
  SelectedChainImg,
  SendIcon,
  UserMessage,
  UserMessageWrapper,
} from './styled'

const DEFAULT_LOADING_TEXT = 'KAI is checking the data ...'
const DEFAULT_CHAT_PLACEHOLDER_TEXT = 'Write a message...'
const DEFAULT_CHAIN_ID = 1

const KaiPanel = () => {
  const chatPanelRef = useRef<HTMLDivElement>(null)

  const [chatPlaceHolderText, setChatPlaceHolderText] = useState(DEFAULT_CHAT_PLACEHOLDER_TEXT)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState(DEFAULT_LOADING_TEXT)
  const [listActions, setListActions] = useState<KaiAction[]>([KAI_ACTIONS.MAIN_MENU])
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID)

  const whitelistTokens = useAllTokens(true, chainId)
  const whitelistTokenAddress = useMemo(() => Object.keys(whitelistTokens), [whitelistTokens])

  const { data: quoteData } = useGetQuoteByChainQuery()
  const quoteSymbol = useMemo(
    () => quoteData?.data?.onchainPrice?.usdQuoteTokenByChainId?.[chainId || 1]?.symbol,
    [chainId, quoteData],
  )

  const lastAction = useMemo(() => {
    const cloneListActions = [...listActions]
    cloneListActions.reverse()

    return cloneListActions.find(
      (action: KaiAction) =>
        action.type !== ActionType.INVALID &&
        action.type !== ActionType.INVALID_AND_BACK &&
        action.type !== ActionType.USER_MESSAGE,
    )
  }, [listActions])

  const lastActiveActionIndex = useMemo(() => {
    const clonelistActions = [...listActions]
    let index = clonelistActions.length - 1
    for (let i = clonelistActions.length - 1; i >= 0; i--) {
      if (clonelistActions[i].type !== ActionType.INVALID && clonelistActions[i].type !== ActionType.USER_MESSAGE) {
        index = i
        break
      }
    }

    return index
  }, [listActions])

  const onSubmitChat = (text: string) => {
    if (loading || !lastAction) return
    if (lastAction.loadingText) setLoadingText(lastAction.loadingText)
    setLoading(true)
    onChangeListActions([
      {
        title: text,
        type: ActionType.USER_MESSAGE,
      },
    ])
  }

  const onChangeListActions = (newActions: KaiAction[]) => {
    const cloneListActions = [...listActions]
    setListActions(cloneListActions.concat(newActions))
  }

  const getActionResponse = async () => {
    const lastUserAction = listActions[listActions.length - 1]
    if (lastUserAction?.type === ActionType.USER_MESSAGE) {
      const newActions: KaiAction[] =
        (await lastAction?.response?.({
          answer: lastUserAction?.title?.toLowerCase() || '',
          chainId,
          whitelistTokenAddress,
          arg: lastAction.arg,
          quoteSymbol,
        })) || []
      if (newActions.length) onChangeListActions(newActions)

      setLoading(false)
      setLoadingText(DEFAULT_LOADING_TEXT)
    }
  }

  useEffect(() => {
    if (lastAction?.placeholder) setChatPlaceHolderText(lastAction.placeholder)
    else setChatPlaceHolderText(DEFAULT_CHAT_PLACEHOLDER_TEXT)
  }, [lastAction])

  useEffect(() => {
    if (chatPanelRef.current)
      chatPanelRef.current.scrollTo({ top: chatPanelRef.current.scrollHeight, behavior: 'smooth' })
  }, [listActions])

  useEffect(() => {
    getActionResponse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listActions])

  return (
    <>
      <KaiHeader chainId={chainId} setChainId={setChainId} />

      <ChatPanel ref={chatPanelRef}>
        <div>GM! What can I do for you today? 👋</div>
        {listActions.map((action: KaiAction, index: number) => {
          const disabled = index !== lastActiveActionIndex

          return action.type === ActionType.MAIN_OPTION ? (
            <ActionPanel key={index}>
              {action.data?.map((option: KaiOption, optionIndex: number) => (
                <MainActionButton
                  disabled={disabled}
                  key={optionIndex}
                  width={option.space}
                  onClick={() => !disabled && onSubmitChat(option.title)}
                >
                  {option.title}
                </MainActionButton>
              ))}
            </ActionPanel>
          ) : action.type === ActionType.OPTION || action.type === ActionType.INVALID_AND_BACK ? (
            <ActionPanel key={index}>
              {action.data?.map((option: KaiOption, optionIndex: number) => (
                <ActionButton
                  disabled={disabled}
                  key={optionIndex}
                  width={option.space}
                  onClick={() => !disabled && onSubmitChat(option.title)}
                >
                  {option.title}
                </ActionButton>
              ))}
            </ActionPanel>
          ) : action.type === ActionType.TEXT || action.type === ActionType.INVALID ? (
            <ActionText key={index}>{action.title}</ActionText>
          ) : action.type === ActionType.HTML && action.title ? (
            <ActionText key={index} dangerouslySetInnerHTML={{ __html: action.title }} />
          ) : action.type === ActionType.USER_MESSAGE ? (
            <UserMessageWrapper key={index} havePrevious={listActions[index - 1].type === ActionType.USER_MESSAGE}>
              <UserMessage
                havePrevious={listActions[index - 1].type === ActionType.USER_MESSAGE}
                haveFollowing={
                  index < listActions.length - 1 && listActions[index + 1].type === ActionType.USER_MESSAGE
                }
              >
                {action.title}
              </UserMessage>
            </UserMessageWrapper>
          ) : null
        })}
      </ChatPanel>

      {loading && <KaiLoading loadingText={loadingText} />}
      <KaiChat
        disabled={loading || lastAction?.type === ActionType.OPTION || lastAction?.type === ActionType.MAIN_OPTION}
        chatPlaceHolderText={chatPlaceHolderText}
        onSubmitChat={onSubmitChat}
      />
    </>
  )
}

const KaiHeader = ({ chainId, setChainId }: { chainId: ChainId; setChainId: (value: number) => void }) => {
  return (
    <>
      <KaiHeaderWrapper>
        <KaiHeaderLeft>
          <KaiAvatar />
          <Flex sx={{ gap: '2px' }} flexDirection={'column'}>
            <HeaderTextName>I&apos;m KAI</HeaderTextName>
            <HeaderSubText>Kyber Assistant Interface</HeaderSubText>
          </Flex>
        </KaiHeaderLeft>
        <NavGroup
          dropdownAlign={'right'}
          anchor={
            <DropdownTextAnchor>
              <ChainAnchorWrapper>
                <SelectedChainImg src={NETWORKS_INFO[chainId].icon} alt="" />
                <ChainAnchorBackground />
              </ChainAnchorWrapper>
            </DropdownTextAnchor>
          }
          dropdownContent={
            <ChainSelectorWrapper>
              {MAINNET_NETWORKS.map(item => (
                <ChainItem key={item} onClick={() => setChainId(item)} active={item === chainId}>
                  <img src={NETWORKS_INFO[item].icon} width="18px" height="18px" alt="" />
                  <span>{NETWORKS_INFO[item].displayName}</span>
                </ChainItem>
              ))}
            </ChainSelectorWrapper>
          }
        />
      </KaiHeaderWrapper>
      <Divider />
    </>
  )
}

const KaiLoading = ({ loadingText }: { loadingText: string }) => {
  return (
    <LoadingWrapper>
      <Loader />
      <span>{loadingText}</span>
    </LoadingWrapper>
  )
}

const KaiChat = ({
  chatPlaceHolderText,
  onSubmitChat,
  disabled = false,
}: {
  chatPlaceHolderText: string
  onSubmitChat: (text: string) => void
  disabled?: boolean
}) => {
  const [chatInput, setChatInput] = useState('')

  const onChangeChatInput = (e: ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)

  const handleSubmitChatInput = () => {
    if (disabled || !chatInput) return
    onSubmitChat(chatInput.trim())
    setChatInput('')
  }

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    handleSubmitChatInput()
  }

  return (
    <ChatWrapper disabled={disabled}>
      <ChatInput
        type="text"
        id="token-search-input"
        data-testid="token-search-input"
        placeholder={chatPlaceHolderText}
        value={chatInput}
        onChange={onChangeChatInput}
        onKeyDown={handleEnter}
        autoComplete="off"
        disabled={disabled}
      />
      <SendIcon disabled={disabled} onClick={handleSubmitChatInput} />
    </ChatWrapper>
  )
}

export default KaiPanel
