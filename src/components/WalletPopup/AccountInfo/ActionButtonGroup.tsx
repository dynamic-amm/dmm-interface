import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ReactComponent as SendIcon } from 'assets/svg/send_icon.svg'
import { ButtonLight } from 'components/Button'
import { ClickHandlerProps } from 'components/WalletPopup/AccountInfo'

const ActionButton = styled(ButtonLight)`
  flex: 0 1 105px;
  width: 105px;
  height: 40px;
`

type Props = {
  className?: string
} & ClickHandlerProps
const ActionButtonGroup: React.FC<Props> = ({ onClickBuy, onClickReceive, onClickSend, className }) => {
  return (
    <Flex
      className={className}
      sx={{
        justifyContent: 'space-between',
        gap: '4px',
      }}
    >
      <ActionButton onClick={onClickBuy}>
        <DollarIcon />
        <Text as="span" marginLeft="7px">
          <Trans>Buy</Trans>
        </Text>
      </ActionButton>
      <ActionButton onClick={onClickReceive}>
        <SendIcon style={{ transform: 'rotate(180deg)' }} />
        <Text as="span" marginLeft="7px">
          <Trans>Receive</Trans>
        </Text>
      </ActionButton>
      <ActionButton onClick={onClickSend}>
        <SendIcon />
        <Text as="span" marginLeft="7px">
          <Trans>Send</Trans>
        </Text>
      </ActionButton>
    </Flex>
  )
}

export default styled(ActionButtonGroup)``
