import { ChainId, Currency, Fraction } from '@kyberswap/ks-sdk-core'

export enum LimitOrderTab {
  ORDER_BOOK = 'order_book',
  MY_ORDER = 'my_order',
}

export enum LimitOrderStatus {
  // status from BE
  ACTIVE = 'active',
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLING = 'cancelling',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  // custom status
  CANCELLED_FAILED = 'cancelled_failed',
}

export type LimitOrder = {
  id: number
  nonce: number
  chainId: ChainId
  makerAsset: string
  takerAsset: string
  makerAssetSymbol: string
  takerAssetSymbol: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  makerAssetDecimals: number
  takerAssetDecimals: number
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  status: LimitOrderStatus
  createdAt: number // timestamp in seconds
  expiredAt: number
  transactions: Array<{
    id: number
    txTime: number
    txHash: string
    makingAmount: string
    takingAmount: string
  }>
  contractAddress: string
  operatorSignatureExpiredAt?: number
  // custom
  isSuccessful: boolean
  uuid: string
  txHash: string
}

export type LimitOrderFromTokenPair = {
  id: number
  chainId: ChainId
  signature: string
  salt: string
  makerAsset: string
  takerAsset: string
  maker: string
  contractAddress: string
  receiver: string
  allowedSenders: string
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  feeConfig: string
  feeRecipient: string
  makerTokenFeePercent: string
  makerAssetData: string
  takerAssetData: string
  getMakerAmount: string
  getTakerAmount: string
  predicate: string
  permit: string
  interaction: string
  expiredAt: number
  orderHash: string
  availableMakingAmount: string
  makerBalanceAllowance: string
  makerAssetDecimals: number
  takerAssetDecimals: number
}

export type LimitOrderFromTokenPairFormatted = {
  id: number
  chainId: ChainId
  rate: string
  makerAmount: string
  takerAmount: string
  filled: string
}

export enum CancelOrderType {
  GAS_LESS_CANCEL,
  HARD_CANCEL,
}

export type RateInfo = {
  rate: string // to store user input
  invertRate: string // to store user input
  invert: boolean
  rateFraction?: Fraction // to calc with big number
}

export type CancelOrderFunction = (data: {
  orders: LimitOrder[]
  cancelType: CancelOrderType
  isEdit?: boolean
}) => Promise<CancelOrderResponse>

export type EditOrderInfo = {
  cancelType?: CancelOrderType
  gasFee?: string
  isEdit?: boolean
  renderCancelButtons: () => JSX.Element
}

export type CancelOrderResponse = {
  orders: { operatorSignatureExpiredAt: number }[]
}

export type CreateOrderParam = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  chainId: ChainId
  account: string | undefined
  inputAmount: string
  outputAmount: string
  expiredAt: number
  orderId?: number
  signature?: string
  salt?: string
  allowedSenders?: string[]
}
