import { ChainId } from '@kyberswap/ks-sdk-core'
import { LiquidityWidget as KsLiquidityWidget, PoolType } from 'kyberswap-liquidity-widgets'
import 'kyberswap-liquidity-widgets/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { Box } from 'rebass'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Input from 'components/Input'
import { NetworkSelector } from 'components/NetworkSelector'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'

export default function LiquidityWidget() {
  const [selectedChainId, setSelectedChainId] = useState(ChainId.ARBITRUM)
  const [poolAddress, setPoolAddress] = useState('0x641C00A822e8b671738d32a431a4Fb6074E5c79d')
  const [positionId, setPositionId] = useState('') //24654
  const [openModal, setOpenModal] = useState(false)
  const { changeNetwork } = useChangeNetwork()
  const [autoAfterChange, setAutoAfterChange] = useState(false)

  const { chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()

  useEffect(() => {
    if (autoAfterChange && chainId === selectedChainId) {
      setOpenModal(true)
      setAutoAfterChange(false)
    }
  }, [autoAfterChange, chainId, selectedChainId])

  const pancakeTheme = useMemo(
    () => ({
      text: '#FFFFFF',
      subText: '#B6AECF',
      icons: '#a9a9a9',
      layer1: '#27262C',
      dialog: '#27262C',
      layer2: '#363046',
      stroke: '#363046',
      chartRange: '#5DC5D2',
      chartArea: '#457F89',
      accent: '#5DC5D2',
      warning: '#F4B452',
      error: '#FF5353',
      success: '#189470',
      fontFamily: 'Kanit, Sans-serif',
      borderRadius: '20px',
      buttonRadius: '16px',
      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
    }),
    [],
  )

  const ksTheme = useMemo(
    () => ({
      text: '#ffffff',
      subText: '#979797',
      icons: '#a9a9a9',
      layer1: '#1C1C1C',
      dialog: '#1c1c1c',
      layer2: '#313131',
      stroke: '#313131',
      chartRange: '#28e0b9',
      chartArea: '#047855',
      accent: '#31cb9e',
      warning: '#ff9901',
      error: '#ff537b',
      success: '#189470',
      fontFamily: 'Work Sans',
      borderRadius: '20px',
      buttonRadius: '24px',
      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.04)',
    }),
    [],
  )

  const [dexType, setType] = useState(PoolType.DEX_UNISWAPV3)
  const [selectedTheme, setSelectedTheme] = useState('ks')
  const [feeAddress, setFeeAddress] = useState('')
  const [feePcm, setFeePcm] = useState(0)

  return (
    <>
      {openModal ? (
        <KsLiquidityWidget
          provider={library}
          theme={selectedTheme === 'pc' ? pancakeTheme : ksTheme}
          poolAddress={poolAddress}
          positionId={positionId || undefined}
          feeAddress={feeAddress}
          feePcm={feePcm}
          poolType={dexType}
          chainId={selectedChainId}
          onTxSubmit={tx => {
            notify(
              {
                title: 'Send Zap tx success',
                type: NotificationType.SUCCESS,
                summary: `Tx: ${tx}`,
                // icon?: ReactNode
                // link: getEtherscanLink(ChainId.ARBITRUM, tx, 'transaction'),
              },
              10_000,
            )
          }}
          onDismiss={() => setOpenModal(false)}
          source={'kyberswap-demo-zap'}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '500px',
            gap: '1rem',
            width: '100%',
            color: '#fff',
          }}
        >
          <NetworkSelector chainId={selectedChainId} customOnSelectNetwork={chain => setSelectedChainId(chain)} />
          <div>
            <input
              type="radio"
              id="kstheme"
              value="ks"
              checked={selectedTheme === 'ks'}
              onChange={e => setSelectedTheme(e.currentTarget.value)}
            />
              <label htmlFor="kstheme">KyberSwap Theme</label>
            <br />
            <input
              type="radio"
              id="pctheme"
              value="pc"
              checked={selectedTheme === 'pc'}
              onChange={e => setSelectedTheme(e.currentTarget.value)}
            />
              <label htmlFor="pctheme">Pancake Theme</label>
            <br />
          </div>

          <div>
            <input
              type="radio"
              id="html"
              value={PoolType.DEX_PANCAKESWAPV3}
              checked={dexType === PoolType.DEX_PANCAKESWAPV3}
              onChange={e => setType(e.currentTarget.value as PoolType)}
            />
              <label htmlFor="html">Pancake</label>
            <br />
            <input
              type="radio"
              id="css"
              value={PoolType.DEX_UNISWAPV3}
              checked={dexType === PoolType.DEX_UNISWAPV3}
              onChange={e => setType(e.currentTarget.value as PoolType)}
            />
              <label htmlFor="css">Uniswap</label>
            <br />
          </div>
          <Input placeholder="Pool address..." value={poolAddress} onChange={e => setPoolAddress(e.target.value)} />
          <Input placeholder="Position id..." value={positionId} onChange={e => setPositionId(e.target.value)} />

          <Input placeholder="Fee address..." value={feeAddress} onChange={e => setFeeAddress(e.target.value)} />
          <Input placeholder="Fee pcm..." value={feePcm} onChange={e => setFeePcm(+e.target.value)} />
          <ButtonPrimary
            onClick={() => {
              if (selectedChainId !== chainId) {
                changeNetwork(selectedChainId)
                setAutoAfterChange(true)
              } else {
                setOpenModal(true)
              }
            }}
          >
            Load
          </ButtonPrimary>
        </Box>
      )}
    </>
  )
}
