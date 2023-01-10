import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { Download } from 'react-feather'
import { QRCode } from 'react-qrcode-logo'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import KncLogo from 'assets/images/kyber_logo_black.png'
import { AddressInput } from 'components/AddressInputPanel'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'

const QR_SIZE = 200
const QR_ID = 'react-qrcode-logo'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  gap: 14px;
  justify-content: space-between;

  #${QR_ID} {
    border-radius: 16px;
  }
`

export default function ReceiveToken() {
  const { account = '', chainId, isEVM } = useActiveWeb3React()
  const [qrConfig, setQrConfig] = useState<{ [key: string]: any } | null>(null)
  const copyButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!account) {
      return
    }

    setQrConfig({
      logoImage: KncLogo,
      size: QR_SIZE,
      value: isEVM ? `ethereum:${account}` : account,
      eyeColor: { outer: '#000000', inner: '#000000' },
      quietZone: '14',
    })
  }, [account, isEVM])

  const onCopy = async () => {
    copyButtonRef.current?.click()
  }

  const downLoadQR = () => {
    try {
      const canvas = document.getElementById(QR_ID) as HTMLCanvasElement
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your_qrcode-logo.png'

      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {}
  }

  const theme = useTheme()

  let qrElement = null
  try {
    qrElement = qrConfig ? <QRCode {...qrConfig} /> : <div style={{ height: QR_SIZE + 20 }} />
  } catch (error) {}
  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 32, flex: 1, justifyContent: 'center' }}>
        <Column
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {qrElement}

          <Flex
            onClick={downLoadQR}
            color={theme.primary}
            fontSize="14px"
            alignItems={'center'}
            style={{ gap: 5, cursor: 'pointer' }}
          >
            <Text>
              <Trans>Download Image</Trans>
            </Text>
            <Download size={14} />
          </Flex>
        </Column>

        <Column gap="12px">
          <Label>
            <Trans>Your Wallet Address</Trans>
          </Label>

          <MouseoverTooltip placement="bottom" text={t`Copy address to clipboard`}>
            <Flex
              onClick={onCopy}
              role="button"
              sx={{
                flexDirection: 'column',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <AddressInput
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, account, 17)}
                icon={<CopyHelper ref={copyButtonRef} toCopy={account} style={{ color: theme.subText }} />}
              />
            </Flex>
          </MouseoverTooltip>
        </Column>
      </Flex>
    </Wrapper>
  )
}
