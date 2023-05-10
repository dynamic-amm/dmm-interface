import { TransactionResponse } from '@ethersproject/abstract-provider'
import { CurrencyAmount, Percent, Token } from '@kyberswap/ks-sdk-core'
import { NonfungiblePositionManager, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { captureException } from '@sentry/react'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { ButtonOutlined } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import { Position as SubgraphPosition, config } from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { formatDollarAmount } from 'utils/numbers'
import { ErrorName } from 'utils/sentry'
import { unwrappedToken } from 'utils/wrappedCurrency'

const tickReaderInterface = new Interface(TickReaderABI.abi)

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 24px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  min-width: 720px;
  overflow-x: scroll;
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  grid-template-columns: 1fr 2fr 1fr 1.5fr 1fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  align-items: center;
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
`

export default function PositionLegacy({ positions }: { positions: SubgraphPosition[] }) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()

  const addresses = [...new Set(positions.map(item => [item.token0.id, item.token1.id]).flat())]
  const tokenPrices = useTokenPrices(addresses)

  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.id]: ['0', '0'] }), {}))

  const multicallContract = useMulticallContract()

  useEffect(() => {
    const getData = async () => {
      if (!multicallContract) return
      const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
      const callParams = positions.map(item => {
        return {
          target: (networkInfo as EVMNetworkInfo).elastic.tickReader,
          callData: tickReaderInterface.encodeFunctionData(fragment, [
            config[chainId].positionManagerContract,
            item.pool.id,
            item.id,
          ]),
        }
      })

      const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
      setFeeRewards(
        returnData.reduce(
          (
            acc: { [tokenId: string]: [string, string] },
            item: { success: boolean; returnData: string },
            index: number,
          ) => {
            if (item.success) {
              const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
              return {
                ...acc,
                [positions[index].id]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
              }
            }
            return { ...acc, [positions[index].id]: ['0', '0'] }
          },
          {} as { [tokenId: string]: [string, string] },
        ),
      )
    }

    getData()
    // eslint-disable-next-line
  }, [chainId, multicallContract, networkInfo, JSON.stringify(positions)])

  const [allowedSlippage] = useUserSlippageTolerance()
  const deadline = useTransactionDeadline()

  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransactionWithType = useTransactionAdder()
  const [showPendingModal, setShowPendingModal] = useState(false)

  const handleDismiss = () => {
    setShowPendingModal(false)
    setTxnHash('')
    setAttemptingTxn(false)
    setRemoveLiquidityError('')
  }

  return (
    <Wrapper>
      <TableHeader>
        <Text>NFT ID</Text>
        <Text>Pool</Text>
        <Text>My Liquidity</Text>
        <Text>My Fee Earning</Text>
        <Text textAlign="right">Action</Text>
      </TableHeader>

      {positions.map(item => {
        const token0 = new Token(
          chainId,
          item.token0.id,
          Number(item.token0.decimals),
          item.token0.symbol,
          item.token0.name,
        )
        const token1 = new Token(
          chainId,
          item.token1.id,
          Number(item.token1.decimals),
          item.token1.symbol,
          item.token1.name,
        )

        const pool = new Pool(
          token0,
          token1,
          +item.pool.feeTier,
          item.pool.sqrtPrice,
          item.pool.liquidity,
          item.pool.reinvestL,
          +item.pool.tick,
        )

        const position = new Position({
          pool,
          liquidity: item.liquidity,
          tickLower: +item.tickLower.tickIdx,
          tickUpper: +item.tickUpper.tickIdx,
        })

        const usd =
          (tokenPrices[position.amount0.currency.wrapped.address] || 0) * +position.amount0.toExact() +
          (tokenPrices[position.amount1.currency.wrapped.address] || 0) * +position.amount1.toExact()

        const feeValue0 = CurrencyAmount.fromRawAmount(unwrappedToken(token0), feeRewards[item.id][0])
        const feeValue1 = CurrencyAmount.fromRawAmount(unwrappedToken(token1), feeRewards[item.id][1])

        return (
          <TableRow key={item.id}>
            <Text>{item.id}</Text>

            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={token0} currency1={token1} />
              <Text color={theme.primary}>
                {token0.symbol} - {token1.symbol}
              </Text>
              <FeeTag>Fee {((Number(item.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
            </Flex>

            <Flex alignItems="center" justifyContent="flex-start" width="fit-content">
              <MouseoverTooltip
                width="fit-content"
                placement="bottom"
                text={
                  <Flex flexDirection="column">
                    <Flex sx={{ gap: '4px' }} alignItems="center">
                      <CurrencyLogo currency={position.amount0.currency} size="16px" />
                      <Text fontWeight="500">{position.amount0.toSignificant(6)}</Text>
                      <Text fontWeight="500">{position.amount0.currency.symbol}</Text>
                    </Flex>

                    <Flex sx={{ gap: '4px' }} alignItems="center" marginTop="6px">
                      <CurrencyLogo currency={position.amount1.currency} size="16px" />
                      <Text fontWeight="500">{position.amount1.toSignificant(6)}</Text>
                      <Text fontWeight="500">{position.amount1.currency.symbol}</Text>
                    </Flex>
                  </Flex>
                }
              >
                {formatDollarAmount(usd)}
                <DropdownSvg />
              </MouseoverTooltip>
            </Flex>

            <Flex flexDirection="column" sx={{ gap: '6px' }}>
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={token0} size="16px" />
                <Text fontWeight="500">{feeValue0.toSignificant(6)}</Text>
                <Text fontWeight="500">{token0.symbol}</Text>
              </Flex>

              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={token1} size="16px" />
                <Text fontWeight="500">{feeValue1.toSignificant(6)}</Text>
                <Text fontWeight="500">{token1.symbol}</Text>
              </Flex>
            </Flex>

            <Flex justifyContent="flex-end">
              <ButtonOutlined
                padding="8px 12px"
                width="fit-content"
                onClick={() => {
                  if (!deadline || !account || !library) {
                    setShowPendingModal(true)
                    setRemoveLiquidityError('Something went wrong!')
                    return
                  }
                  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(position, {
                    tokenId: item.id,
                    liquidityPercentage: new Percent('100'),
                    slippageTolerance: basisPointsToPercent(allowedSlippage),
                    deadline: deadline.toString(),
                    collectOptions: {
                      expectedCurrencyOwed0: feeValue0.subtract(
                        feeValue0.multiply(basisPointsToPercent(allowedSlippage)),
                      ),
                      expectedCurrencyOwed1: feeValue1.subtract(
                        feeValue1.multiply(basisPointsToPercent(allowedSlippage)),
                      ),
                      recipient: account,
                      deadline: deadline.toString(),
                      isRemovingLiquid: true,
                      havingFee: !(feeValue0.equalTo(JSBI.BigInt('0')) && feeValue1.equalTo(JSBI.BigInt('0'))),
                    },
                  })

                  const txn = {
                    to: config[chainId].positionManagerContract,
                    data: calldata,
                    value,
                  }

                  library
                    .getSigner()
                    .estimateGas(txn)
                    .then(async (estimate: BigNumber) => {
                      const newTxn = {
                        ...txn,
                        gasLimit: calculateGasMargin(estimate),
                      }
                      return library
                        .getSigner()
                        .sendTransaction(newTxn)
                        .then((response: TransactionResponse) => {
                          setAttemptingTxn(false)
                          const tokenAmountIn = position.amount0.toSignificant(6)
                          const tokenAmountOut = position.amount1.toSignificant(6)
                          const tokenSymbolIn = token0.symbol
                          const tokenSymbolOut = token1.symbol
                          addTransactionWithType({
                            hash: response.hash,
                            type: TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
                            extraInfo: {
                              tokenAmountIn,
                              tokenAmountOut,
                              tokenSymbolIn,
                              tokenSymbolOut,
                              tokenAddressIn: token0.address,
                              tokenAddressOut: token1.address,
                              contract: item.pool.id,
                              nftId: item.id,
                            },
                          })
                          setTxnHash(response.hash)
                        })
                    })
                    .catch((error: any) => {
                      setShowPendingModal(true)
                      setAttemptingTxn(false)

                      if (error?.code !== 'ACTION_REJECTED') {
                        const e = new Error('Remove Legacy Elastic Liquidity Error', { cause: error })
                        e.name = ErrorName.RemoveElasticLiquidityError
                        captureException(e, {
                          extra: {
                            calldata,
                            value,
                            to: config[chainId].positionManagerContract,
                          },
                        })
                      }

                      setRemoveLiquidityError(error?.message || JSON.stringify(error))
                    })
                }}
              >
                Remove Liquidity
              </ButtonOutlined>
            </Flex>
          </TableRow>
        )
      })}
      <TransactionConfirmationModal
        isOpen={showPendingModal}
        onDismiss={handleDismiss}
        hash={txnHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Staking into farm`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {removeLiquidityError ? (
              <TransactionErrorContent onDismiss={handleDismiss} message={removeLiquidityError} />
            ) : null}
          </Flex>
        )}
      />
    </Wrapper>
  )
}
