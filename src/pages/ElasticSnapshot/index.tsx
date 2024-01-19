import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Tabs from 'components/Tabs'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import TreasuryGrantAndInstantClaim from './components/TreasuryGrantAndInstantClaim'
import poolsByCategoriesRaw from './data/category.json'
import data from './data/data.json'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

const StyledTabs = styled(Tabs)`
  border-top: 1px solid ${({ theme }) => theme.border};
  border-radius: 0px;
  background: ${({ theme }) => theme.background};
`

const Tag = styled.div`
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => rgba(theme.primary, 0.3)};
  color: ${({ theme }) => theme.primary};
`

const poolsByCategories: {
  [key: string]: {
    [key: string]: string[]
  }
} = {}

Object.keys(poolsByCategoriesRaw).forEach(key => {
  const dataByCat = poolsByCategoriesRaw[key]
  poolsByCategories[key] = {}

  Object.keys(dataByCat).forEach(network => {
    poolsByCategories[key][network] = (dataByCat[network as keyof typeof dataByCat] as any[]).map(
      (item: any) => item.pool,
    )
  })
})

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  overflow: hidden;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border: none;
    border-radius: 0;
  `}
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  grid-template-columns: 1fr 0.75fr 1fr 1fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  align-items: center;
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    background: ${({ theme }) => theme.buttonBlack};
    justify-content: space-between;
  `}
`

interface Position {
  position_id: number
  liquidity_usd: number
  position_usd: number
  fee_usd: number
  info: {
    pool: string
    chain: string
    token0_symbol: string
    token1_symbol: string
    token0_address: string
    token1_address: string
  }
}

export default function ElasticSnapshot() {
  const { account } = useActiveWeb3React()

  const theme = useTheme()

  const userInfo = data.find(item => item.user_address.toLowerCase() === account?.toLowerCase())

  const categories = ['category 1', 'category 2', 'category 3', 'category 4', 'category 5']

  const positionsByCategories: Array<Position[]> = []

  categories.forEach(cat => {
    const temp: Position[] = []
    userInfo?.positions.forEach(pos => {
      if (poolsByCategories[cat]?.[pos.info.chain]?.includes(pos.info.pool)) temp.push(pos)
    })

    positionsByCategories.push(temp)
  })
  const [selectedCategory, setSelectedCategory] = useState(0)

  const toggleWalletModal = useWalletModalToggle()

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const categoriesDesc = [
    <Trans key={0}>
      Affected Assets taken from Affected Pools by the primary KyberSwap Elastic Exploit (“Primary Exploit”) which
      commenced on November 22, 2023 at 10:54 PM UTC, which Affected Assets have yet to be recovered{' '}
    </Trans>,
    <Trans key={1}>
      Affected Assets taken from Affected Pools by subsequent activity (“Category 2 MBA”) of two mimicking bots
      mimicking the Primary Exploit, which Affected Assets have yet to be recovered
    </Trans>,
    <Trans key={2}>
      Affected Assets taken from Affected Pools by subsequent activity (“Category 3 MBA” which together with Category 2
      MBA collectively referred to as “MBA”) of two front-run bots mimicking the Primary Exploit – which Affected Assets
      have been partially recovered along with assets (“Category 3 Swapped Affected Assets”) into which part of such
      Affected Assets have been swapped into by such front-run bots.
    </Trans>,
    <Trans key={3}>
      Affected Assets presently locked in Affected Pools due to incorrect pool state as a result of the Primary Exploit
      and MBA.
    </Trans>,
    <Trans key={4}>
      Affected Assets previously locked in Affected Pools due to incorrect pool state as a result of the Primary
      Exploit, but which have been recovered from such liquidity pools.
    </Trans>,
  ]

  return (
    <PoolsPageWrapper>
      <Flex
        justifyContent="space-between"
        sx={{ gap: '1rem' }}
        flexDirection={upToMedium ? 'column' : 'row'}
        alignItems="center"
      >
        <Flex flexDirection="column" sx={{ gap: '12px' }} flex={3}>
          <Text as="h2" fontSize={24} fontWeight="500">
            <Trans>Snapshot</Trans>
          </Text>
          <Text fontSize={14} color={theme.subText} lineHeight="20px">
            <Trans>
              You can find the list of your liquidity positions in KyberSwap Elastic pools that were affected by the
              exploit below. Snapshots for each chain are taken based on the last block prior to the exploit.
              <br />
              <br />
              Prices are sourced based on the closest available pricing data from CoinGecko immediately following the
              exploit.
            </Trans>
          </Text>
          <ExternalLink href="https://blog.kyberswap.com/kyberswap-treasury-grant-program/">
            <Text fontSize="14px">
              <Trans>Official announcement is here ↗</Trans>
            </Text>
          </ExternalLink>
        </Flex>

        <Flex flexDirection="column" sx={{ gap: '12px', width: '100%', maxWidth: '580px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: upToSmall ? '1fr 1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
            <Flex
              flexDirection="column"
              padding="12px"
              justifyContent="space-between"
              sx={{ gap: '16px', borderRadius: '12px' }}
              backgroundColor="rgba(0,0,0,0.64)"
            >
              <Text fontSize="14px" fontWeight="500" color={theme.subText}>
                <Trans>Total Amount (USD)</Trans>
              </Text>
              <Text fontWeight="500" fontSize={20}>
                {userInfo ? format(userInfo.total_usd) : '--'}
              </Text>
            </Flex>

            {upToSmall && <div />}

            <Flex
              flexDirection="column"
              padding="12px"
              justifyContent="space-between"
              sx={{ gap: '16px', borderRadius: '12px' }}
              backgroundColor="rgba(0,0,0,0.64)"
            >
              <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
                <Trans>
                  Total Liquidity Amount
                  <br />
                  (USD)
                </Trans>
              </Text>
              <Text fontWeight="500" fontSize={20}>
                {userInfo ? format(userInfo.total_liquidity_usd) : '--'}
              </Text>
            </Flex>

            <Flex
              flexDirection="column"
              padding="12px"
              justifyContent="space-between"
              sx={{ gap: '16px', borderRadius: '12px' }}
              backgroundColor="rgba(0,0,0,0.64)"
            >
              <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
                <Trans>
                  Total Fees Amount
                  <br />
                  (USD)
                </Trans>
              </Text>
              <Text fontWeight="500" fontSize={20}>
                {userInfo ? format(userInfo.total_fee_usd) : '--'}
              </Text>
            </Flex>
          </Box>
          <Text color={theme.subText} fontStyle="italic" fontSize="10px" textAlign="right">
            <Trans>Total Amount (USD) = Total Liquidity Amount (USD) + Total Fees Amount (USD)</Trans>
          </Text>
        </Flex>
      </Flex>

      {userInfo && <TreasuryGrantAndInstantClaim />}

      <Flex flexDirection="column" marginTop="1.5rem" marginX={upToSmall ? '-1rem' : 0}>
        <Wrapper>
          {account ? (
            userInfo ? (
              <>
                <Text textAlign="left" fontSize="14px" padding="16px 24px">
                  <Trans>Wallet address</Trans>:{' '}
                  <Text as="span" fontWeight="500" color={theme.text}>
                    {upToSmall ? shortenAddress(1, account) : account}
                  </Text>
                </Text>

                <StyledTabs
                  activeKey={selectedCategory}
                  onChange={key => setSelectedCategory(+key)}
                  tabItemStyle={{ background: theme.background }}
                  items={categories.map((_, index) => {
                    return {
                      key: index,
                      label: (
                        <Text fontWeight="500" fontSize="14px" display="flex" alignItems="center" sx={{ gap: '4px' }}>
                          <Trans>Category</Trans> {index + 1}{' '}
                          {!!positionsByCategories[index].length && <Tag>{positionsByCategories[index].length}</Tag>}
                        </Text>
                      ),
                      children: (
                        <Flex
                          alignItems={upToMedium ? 'flex-start' : 'center'}
                          padding="1rem"
                          sx={{ gap: '24px' }}
                          justifyContent="space-between"
                          flexDirection={upToMedium ? 'column-reverse' : 'row'}
                        >
                          <Box textAlign="left">
                            <Text fontWeight="500" fontSize={20} color={theme.text}>
                              <Trans>Category</Trans> {selectedCategory + 1}
                            </Text>
                            <Text fontSize={14} fontWeight="500" marginY="1rem">
                              {categoriesDesc[selectedCategory]}
                            </Text>
                          </Box>

                          <Box
                            minWidth={upToMedium ? '100%' : '180px'}
                            textAlign="left"
                            backgroundColor={theme.buttonBlack}
                            padding="12px"
                            sx={{
                              borderRadius: '12px',
                            }}
                          >
                            <Text fontSize={14} fontWeight="500">
                              <Trans>Total Amount (USD)</Trans>
                            </Text>

                            <Text marginTop="24px" fontSize="20px" color={theme.text} fontWeight="500">
                              {format(positionsByCategories[selectedCategory].reduce((s, c) => s + c.position_usd, 0))}
                            </Text>
                          </Box>
                        </Flex>
                      ),
                    }
                  })}
                />

                {!upToSmall && (
                  <TableHeader>
                    <Text textAlign="left">POOLS</Text>
                    <Text textAlign="right">NFT ID</Text>

                    <Text
                      textAlign="right"
                      sx={{ borderBottom: `1px dotted ${theme.border}` }}
                      width="fit-content"
                      marginLeft="auto"
                    >
                      <MouseoverTooltip
                        text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                      >
                        <Trans>POSITION LIQUIDITY (USD)</Trans>
                      </MouseoverTooltip>
                    </Text>
                    <Text
                      textAlign="right"
                      sx={{ borderBottom: `1px dotted ${theme.border}` }}
                      width="fit-content"
                      marginLeft="auto"
                    >
                      <MouseoverTooltip
                        text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                      >
                        <Trans>POSITION FEE (USD)</Trans>
                      </MouseoverTooltip>
                    </Text>
                  </TableHeader>
                )}

                {!positionsByCategories[selectedCategory].length && (
                  <Text padding="48px 16px">
                    <Trans>
                      None of the liquidity position(s) held by your wallet ({shortenAddress(1, account)}) were affected
                      by the exploit on this category.
                    </Trans>
                  </Text>
                )}
                {positionsByCategories[selectedCategory].map(item => (
                  <TableRow key={item.position_id}>
                    <Flex>
                      <Logo
                        address0={item.info.token0_address}
                        address1={item.info.token1_address}
                        chainId={chainToChainId[item.info.chain]}
                      />
                      {item.info.token0_symbol} - {item.info.token1_symbol}
                    </Flex>
                    <Text textAlign="right">#{item.position_id}</Text>

                    {upToSmall && (
                      <>
                        <MouseoverTooltip
                          text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                        >
                          <Text
                            color={theme.subText}
                            fontSize="12px"
                            fontWeight="500"
                            sx={{ borderBottom: `1px dotted ${theme.border}` }}
                          >
                            POSITION LIQUIDITY (USD)
                          </Text>
                        </MouseoverTooltip>

                        <Text
                          color={theme.subText}
                          fontSize="12px"
                          fontWeight="500"
                          width="fit-content"
                          justifySelf="flex-end"
                          sx={{ borderBottom: `1px dotted ${theme.border}` }}
                        >
                          <MouseoverTooltip
                            text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                          >
                            POSITION FEES (USD)
                          </MouseoverTooltip>
                        </Text>
                      </>
                    )}
                    <Text textAlign={upToSmall ? 'left' : 'right'}>{format(item.liquidity_usd)}</Text>
                    <Text textAlign="right">{format(item.fee_usd)}</Text>
                  </TableRow>
                ))}
              </>
            ) : (
              <Flex padding="36px 16px" justifyContent="center" alignItems="center" flexDirection="column">
                <Info size={64} />
                <Text fontSize={14} marginTop="24px">
                  <Trans>
                    None of the liquidity position(s) held by your wallet ({shortenAddress(1, account)}) were affected
                    by the exploit.
                  </Trans>
                </Text>
              </Flex>
            )
          ) : (
            <Flex padding="48px 16px" justifyContent="center" alignItems="center" flexDirection="column">
              <Text fontSize="14px" marginBottom="24px">
                <Trans>Please connect your wallet to view your affected position(s).</Trans>
              </Text>

              <ButtonPrimary onClick={toggleWalletModal} width="94px">
                <Trans>Connect</Trans>
              </ButtonPrimary>
            </Flex>
          )}
        </Wrapper>
      </Flex>
    </PoolsPageWrapper>
  )
}

const chainToChainId: { [key: string]: ChainId } = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
  cronos: 25,
  polygon: 137,
}
const Logo = ({ chainId, address0, address1 }: { chainId: ChainId; address0: string; address1: string }) => {
  const allTokens = useAllTokens(true, chainId)

  return (
    <Box sx={{ position: 'relative' }}>
      <DoubleCurrencyLogo
        size={20}
        currency0={allTokens[address0.toLowerCase()]}
        currency1={allTokens[address1.toLowerCase()]}
      />

      <img
        src={NETWORKS_INFO[chainId].icon}
        style={{ position: 'absolute', bottom: 0, right: '4px', zIndex: 1 }}
        width="12px"
        height="12px"
        alt=""
      />
    </Box>
  )
}
