import { formatDisplayNumber } from 'utils/numbers'

import { isNumber } from './utils'

export enum Space {
  HALF_WIDTH = 'calc(50% - 6px)',
  FULL_WIDTH = '100%',
  ONE_THIRD_WIDTH = 'calc((100% - 24px) / 3)',
}

export enum ActionType {
  TEXT,
  OPTION,
  MAIN_OPTION,
  USER_MESSAGE,
  INVALID,
  HTML,
  INVALID_AND_BACK,
}

export interface KaiAction {
  uuid?: string
  title?: string
  type: ActionType
  data?: KaiOption[]
  arg?: any
  placeholder?: string
  loadingText?: string
  response?: (...args: any[]) => KaiAction[] | Promise<KaiAction[]>
}

export interface KaiOption {
  title: string
  space: Space
}

interface ListOptions {
  [optionKey: string]: KaiOption
}

interface ListActions {
  [actionKey: string]: KaiAction
}

const KAI_OPTIONS: ListOptions = {
  CHECK_TOKEN_PRICE: {
    title: 'Check the token price',
    space: Space.FULL_WIDTH,
  },
  SEE_MARKET_TRENDS: {
    title: 'See market trends',
    space: Space.FULL_WIDTH,
  },
  FIND_HIGH_APY_POOLS: {
    title: 'Find high APY pools',
    space: Space.FULL_WIDTH,
  },
  SWAP_TOKEN: {
    title: 'Buy/Sell tokens',
    space: Space.HALF_WIDTH,
  },
  LIMIT_ORDER: {
    title: 'Limit Order',
    space: Space.HALF_WIDTH,
  },
  ADD_LIQUIDITY: {
    title: 'Add liquidity',
    space: Space.FULL_WIDTH,
  },
  TOP_BIG_SPREAD: {
    title: 'Top 24h Big Spread',
    space: Space.FULL_WIDTH,
  },
  TOP_GAINERS: {
    title: 'Top 24h Gainers',
    space: Space.HALF_WIDTH,
  },
  TOP_VOLUME: {
    title: 'Top 24h Volume',
    space: Space.HALF_WIDTH,
  },
  SEARCH_ANOTHER_TOKEN: {
    title: 'Search another token',
    space: Space.FULL_WIDTH,
  },
  CUSTOM_MAX_SLIPPAGE: {
    title: 'Custom',
    space: Space.ONE_THIRD_WIDTH,
  },
  BACK_TO_MENU: {
    title: '↩ Back to the main menu',
    space: Space.FULL_WIDTH,
  },
  CONFIRM_SWAP: {
    title: 'Confirm trade',
    space: Space.FULL_WIDTH,
  },
}

export const MAIN_MENU: KaiOption[] = [
  KAI_OPTIONS.CHECK_TOKEN_PRICE,
  KAI_OPTIONS.SEE_MARKET_TRENDS,
  KAI_OPTIONS.SWAP_TOKEN,
  KAI_OPTIONS.LIMIT_ORDER,
  KAI_OPTIONS.FIND_HIGH_APY_POOLS,
  KAI_OPTIONS.ADD_LIQUIDITY,
]

export const KAI_ACTIONS: ListActions = {
  MAIN_MENU: {
    type: ActionType.MAIN_OPTION,
    data: MAIN_MENU,
    placeholder: 'Ask me anything or select...',
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.CHECK_TOKEN_PRICE.title.toLowerCase()) return [KAI_ACTIONS.TYPE_TOKEN_TO_CHECK_PRICE]
      if (answer === KAI_OPTIONS.SEE_MARKET_TRENDS.title.toLowerCase())
        return [KAI_ACTIONS.SEE_MARKET_TRENDS_WELCOME, KAI_ACTIONS.SEE_MARKET_TRENDS]
      if (answer === KAI_OPTIONS.SWAP_TOKEN.title.toLowerCase())
        return [KAI_ACTIONS.SWAP_TOKEN, KAI_ACTIONS.SWAP_INPUT_TOKEN_IN]
      if (MAIN_MENU.find((option: KaiOption) => answer.trim().toLowerCase() === option.title.toLowerCase()))
        return [KAI_ACTIONS.COMING_SOON]
      return [KAI_ACTIONS.INVALID]
    },
  },
  BACK_TO_MENU: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      return [KAI_ACTIONS.INVALID]
    },
  },
  INVALID_BACK_TO_MENU: {
    type: ActionType.INVALID_AND_BACK,
    data: [KAI_OPTIONS.BACK_TO_MENU],
  },
  DO_SOMETHING_AFTER_CHECK_PRICE: {
    type: ActionType.OPTION,
    data: [
      { ...KAI_OPTIONS.SWAP_TOKEN, space: Space.FULL_WIDTH },
      KAI_OPTIONS.SEARCH_ANOTHER_TOKEN,
      KAI_OPTIONS.BACK_TO_MENU,
    ],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.SWAP_TOKEN.title.toLowerCase())
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (answer === KAI_OPTIONS.SEARCH_ANOTHER_TOKEN.title.toLowerCase())
        return [
          {
            title: '💪🏼 Okay! Which token are you interested in? Just type the name or address.',
            type: ActionType.TEXT,
            response: KAI_ACTIONS.TYPE_TOKEN_TO_CHECK_PRICE.response,
          },
        ]
      return [KAI_ACTIONS.INVALID]
    },
  },
  WOULD_LIKE_TO_DO_SOMETHING_ELSE: {
    title: 'Would you like to do something else with this token?',
    type: ActionType.TEXT,
  },
  COMING_SOON: {
    title: '🏃🏻 Coming soon ...',
    type: ActionType.INVALID,
  },
  INVALID: {
    title: '❌ Invalid input, please follow the instruction!',
    type: ActionType.INVALID,
  },
  ERROR: {
    title: '❌ Something went wrong, please try again!',
    type: ActionType.INVALID,
  },
  TOKEN_NOT_FOUND: {
    title: '🔭 I can not find your token, please enter others!',
    type: ActionType.INVALID,
  },
  TOKEN_FOUND: {
    title: '👀 Here are the tokens I found. Which one do you mean?',
    type: ActionType.TEXT,
  },
  TYPE_TOKEN_TO_CHECK_PRICE: {
    title: '🫡 Great! Which token are you interested in? Just type the name or address.',
    type: ActionType.TEXT,
    response: async ({
      answer,
      chainId,
      whitelistTokenAddress,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      whitelistTokenAddress: string[]
      quoteSymbol: string
    }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

      const filter: any = {
        chainId: chainId,
        search: answer,
        page: 1,
        pageSize: 50,
        chainIds: chainId,
        sort: '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets
          .filter(
            (token: any) =>
              token.marketCap && token.tokens.find((item: any) => whitelistTokenAddress.includes(item.address)),
          )
          .map((token: any) => ({
            ...token,
            token: token.tokens.find(
              (item: any) => item.chainId === chainId.toString() && whitelistTokenAddress.includes(item.address),
            ),
          }))
          .filter((token: any) => token.token)
          .sort((a: any, b: any) => b.marketCap - a.marketCap)

        // const result = data.assets
        //   .filter((token: any) => token.marketCap)
        //   .map((token: any) => ({
        //     ...token,
        //     token: token.tokens.find((item: any) => item.chainId === chainId.toString()),
        //   }))
        //   .filter((token: any) => token.token)
        //   .sort((a: any, b: any) => b.marketCap - a.marketCap)

        if (result.length === 1) {
          const token = result[0]
          const showAddress = answer !== token.token.address.toLowerCase()

          return [
            {
              title: `Here’s what I’ve got for ${token.symbol}`,
              type: ActionType.TEXT,
            },
            {
              type: ActionType.HTML,
              title: `
                <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">${
                  showAddress ? '📌 Token contract: ' + token.token.address : ''
                }</div>
                <div style="margin-bottom: 4px">📈 Buy Price: ${
                  token.token.priceBuy
                    ? `${formatDisplayNumber(token.token.priceBuy, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
                <div style="margin-bottom: 4px">📈 Sell Price: ${
                  token.token.priceSell
                    ? `${formatDisplayNumber(token.token.priceSell, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
                <div style="margin-bottom: 4px">🔄 24h Buy Price Change: ${
                  token.token.priceBuyChange24h
                    ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                        Math.abs(token.token.priceBuyChange24h),
                        {
                          style: 'decimal',
                          fractionDigits: 2,
                        },
                      )}%`
                    : '--'
                }</div>
                <div style="margin-bottom: 4px">🔄 24h Sell Price Change: ${
                  token.token.priceSellChange24h
                    ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                        Math.abs(token.token.priceSellChange24h),
                        {
                          style: 'decimal',
                          fractionDigits: 2,
                        },
                      )}%`
                    : '--'
                }</div>
                <div style="margin-bottom: 4px">💸 24h Volume: ${
                  token.volume24h
                    ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                    : '--'
                }</div>
                <div>🏦 Market Cap: ${
                  token.marketCap
                    ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                    : '--'
                }</div>
              `,
            },
            KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
            KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
          ]
        } else if (result.length > 1) {
          return [
            KAI_ACTIONS.TOKEN_FOUND,
            {
              type: ActionType.OPTION,
              data: result
                .map((item: any) => ({
                  title: item.symbol,
                  space: item.symbol.length <= 10 ? Space.HALF_WIDTH : Space.FULL_WIDTH,
                }))
                .concat(KAI_ACTIONS.INVALID_BACK_TO_MENU.data),
              response: ({ answer: tokenSymbolSelected }: { answer: string }) => {
                if (tokenSymbolSelected === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

                const token = result.find((item: any) => item.symbol.toLowerCase() === tokenSymbolSelected)
                if (token) {
                  const showAddress = answer !== token.token.address.toLowerCase()

                  return [
                    {
                      title: `Here’s what I’ve got for ${tokenSymbolSelected}`,
                      type: ActionType.TEXT,
                    },
                    {
                      type: ActionType.HTML,
                      title: `
                        <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">${
                          showAddress ? '📌 Token contract: ' + token.token.address : ''
                        }</div>
                        <div style="margin-bottom: 4px">📈 Buy Price: ${
                          token.token.priceBuy
                            ? `${formatDisplayNumber(token.token.priceBuy, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                        <div style="margin-bottom: 4px">📈 Sell Price: ${
                          token.token.priceSell
                            ? `${formatDisplayNumber(token.token.priceSell, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                        <div style="margin-bottom: 4px">🔄 24h Buy Price Change: ${
                          token.token.priceBuyChange24h
                            ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                                Math.abs(token.token.priceBuyChange24h),
                                {
                                  style: 'decimal',
                                  fractionDigits: 2,
                                },
                              )}%`
                            : '--'
                        }</div>
                        <div style="margin-bottom: 4px">🔄 24h Sell Price Change: ${
                          token.token.priceSellChange24h
                            ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                                Math.abs(token.token.priceSellChange24h),
                                {
                                  style: 'decimal',
                                  fractionDigits: 2,
                                },
                              )}%`
                            : '--'
                        }</div>
                        <div style="margin-bottom: 4px">💸 24h Volume: ${
                          token.volume24h
                            ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                            : '--'
                        }</div>
                        <div>🏦 Market Cap: ${
                          token.marketCap
                            ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                            : '--'
                        }</div>
                      `,
                    },
                    KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
                    KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
                  ]
                }

                return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
              },
            },
          ]
        }

        return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
  SEE_MARKET_TRENDS_WELCOME: {
    title: '🫡 Got it! What would you like to see the trend in 24 hours?',
    type: ActionType.TEXT,
  },
  SEE_MARKET_TRENDS: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.TOP_GAINERS, KAI_OPTIONS.TOP_VOLUME, KAI_OPTIONS.TOP_BIG_SPREAD, KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer }: { answer: string }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (answer === KAI_OPTIONS.TOP_BIG_SPREAD.title.toLowerCase())
        return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      if (
        answer === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase() ||
        answer === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
      )
        return [{ ...KAI_ACTIONS.SEE_MARKET_TRENDS_CHOOSE_AMOUNT, arg: answer }]

      return [KAI_ACTIONS.INVALID]
    },
  },
  SEE_MARKET_TRENDS_CHOOSE_AMOUNT: {
    type: ActionType.OPTION,
    data: [5, 10, 15].map((item: number) => ({ title: item.toString(), space: Space.ONE_THIRD_WIDTH })),
    response: async ({
      answer,
      chainId,
      arg,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      arg: any
      quoteSymbol: string
    }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (!['5', '10', '15'].includes(answer.toString())) return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]

      const filter: any = {
        chainId: chainId,
        search: '',
        page: 1,
        pageSize: answer,
        chainIds: chainId,
        sort:
          arg === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase()
            ? `price_sell_change_24h-${chainId} desc`
            : arg === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
            ? 'volume_24h desc'
            : '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets.map((token: any) => ({
          ...token,
          token: token.tokens.find((item: any) => item.chainId === chainId.toString()),
        }))

        const resultToActionData = result.map((item: any) => {
          const price = item.token.priceSell

          const priceSellChange24h = item.token.priceSellChange24h
            ? `${item.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                Math.abs(item.token.priceSellChange24h),
                {
                  style: 'decimal',
                  fractionDigits: 2,
                },
              )}%`
            : '--'
          const volume24h = item.volume24h
            ? formatDisplayNumber(item.volume24h, { style: 'currency', fractionDigits: 2 })
            : '--'
          const metricValue =
            arg === KAI_OPTIONS.TOP_GAINERS.title.toLowerCase()
              ? priceSellChange24h
              : arg === KAI_OPTIONS.TOP_VOLUME.title.toLowerCase()
              ? volume24h
              : ''
          return {
            title: `💸 ${item.symbol} - ${metricValue} - ${
              price
                ? `${formatDisplayNumber(price, {
                    fractionDigits: 2,
                    significantDigits: 7,
                  })} ${quoteSymbol}`
                : '--'
            }`,
            space: Space.FULL_WIDTH,
          }
        })

        return [
          {
            title: `Here’s the list of ${arg
              .replace('24h', '')
              .trim()} for the last 24h,  click on a token to see more details!`,
            type: ActionType.TEXT,
          },
          {
            type: ActionType.OPTION,
            data: resultToActionData.concat([
              { ...KAI_OPTIONS.SWAP_TOKEN, space: Space.FULL_WIDTH },
              KAI_OPTIONS.BACK_TO_MENU,
            ]),
            response: ({ answer, quoteSymbol }: { answer: string; quoteSymbol: string }) => {
              if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
              if (answer === KAI_OPTIONS.SWAP_TOKEN.title.toLowerCase())
                return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.INVALID_BACK_TO_MENU]

              const index = result.findIndex(
                (item: any) => item.symbol.toLowerCase() === answer.split(' ')?.[1]?.toLowerCase(),
              )

              if (index > -1) {
                const token = result[index]

                return [
                  {
                    type: ActionType.HTML,
                    title: `
                    <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">${
                      '📌 Token contract: ' + token.token.address
                    }</div>
                      <div style="margin-bottom: 4px">📈 Buy Price: ${
                        token.token.priceBuy
                          ? `${formatDisplayNumber(token.token.priceBuy, {
                              fractionDigits: 2,
                              significantDigits: 7,
                            })} ${quoteSymbol}`
                          : '--'
                      }</div>
                      <div style="margin-bottom: 4px">📈 Sell Price: ${
                        token.token.priceSell
                          ? formatDisplayNumber(token.token.priceSell, {
                              fractionDigits: 2,
                              significantDigits: 7,
                            })
                          : '--'
                      }</div>
                      <div style="margin-bottom: 4px">🔄 24h Buy Price Change: ${
                        token.token.priceBuyChange24h
                          ? `${token.token.priceBuyChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                              Math.abs(token.token.priceBuyChange24h),
                              {
                                style: 'decimal',
                                fractionDigits: 2,
                              },
                            )}%`
                          : '--'
                      }</div>
                      <div style="margin-bottom: 4px">🔄 24h Sell Price Change: ${
                        token.token.priceSellChange24h
                          ? `${token.token.priceSellChange24h < 0 ? '-' : ''}${formatDisplayNumber(
                              Math.abs(token.token.priceSellChange24h),
                              {
                                style: 'decimal',
                                fractionDigits: 2,
                              },
                            )}%`
                          : '--'
                      }</div>
                      <div style="margin-bottom: 4px">💸 24h Volume: ${
                        token.volume24h
                          ? formatDisplayNumber(token.volume24h, { style: 'currency', fractionDigits: 2 })
                          : '--'
                      }</div>
                      <div>🏦 Market Cap: ${
                        token.marketCap
                          ? formatDisplayNumber(token.marketCap, { style: 'currency', fractionDigits: 2 })
                          : '--'
                      }</div>
                    `,
                  },
                  KAI_ACTIONS.WOULD_LIKE_TO_DO_SOMETHING_ELSE,
                  KAI_ACTIONS.DO_SOMETHING_AFTER_CHECK_PRICE,
                ]
              }

              return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]
            },
          },
        ]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
  SWAP_TOKEN: {
    title: '💰 Ready to trade! What are you swapping?',
    type: ActionType.TEXT,
  },
  SWAP_INPUT_TOKEN_IN: {
    title: '👉 Input the token you want to sell (Token in)',
    type: ActionType.TEXT,
    placeholder: 'Enter the token in',
    response: async ({
      answer,
      chainId,
      whitelistTokenAddress,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      whitelistTokenAddress: string[]
      quoteSymbol: string
    }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      const filter: any = {
        chainId: chainId,
        search: answer,
        page: 1,
        pageSize: 50,
        chainIds: chainId,
        sort: '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets
          .filter(
            (token: any) =>
              token.marketCap && token.tokens.find((item: any) => whitelistTokenAddress.includes(item.address)),
          )
          .map((token: any) => ({
            ...token,
            token: token.tokens.find(
              (item: any) => item.chainId === chainId.toString() && whitelistTokenAddress.includes(item.address),
            ),
          }))
          .filter((token: any) => token.token)
          .sort((a: any, b: any) => b.marketCap - a.marketCap)

        if (result.length === 1) {
          const token = result[0]
          const showAddress = answer !== token.token.address.toLowerCase()

          return [
            {
              type: ActionType.HTML,
              title: `
                <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">📌 ${
                  showAddress ? `Token contract: ${token.token.address}` : token.symbol
                }</div>
                <div>📈 Sell Price: ${
                  token.token.priceSell
                    ? `${formatDisplayNumber(token.token.priceSell, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
              `,
            },
            {
              ...KAI_ACTIONS.SWAP_INPUT_AMOUNT_IN,
              arg: {
                tokenIn: token,
              },
            },
          ]
        } else if (result.length > 1) {
          return [
            KAI_ACTIONS.TOKEN_FOUND,
            {
              type: ActionType.OPTION,
              data: result
                .map((item: any) => ({
                  title: item.symbol,
                  space: item.symbol.length <= 10 ? Space.HALF_WIDTH : Space.FULL_WIDTH,
                }))
                .concat(KAI_ACTIONS.INVALID_BACK_TO_MENU.data),
              response: ({ answer: tokenSymbolSelected }: { answer: string }) => {
                if (tokenSymbolSelected === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

                const token = result.find((item: any) => item.symbol.toLowerCase() === tokenSymbolSelected)
                if (token) {
                  const showAddress = answer !== token.token.address.toLowerCase()

                  return [
                    {
                      type: ActionType.HTML,
                      title: `
                        <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">📌 ${
                          showAddress ? `Token contract: ${token.token.address}` : token.symbol
                        }</div>
                        <div>📈 Sell Price: ${
                          token.token.priceSell
                            ? `${formatDisplayNumber(token.token.priceSell, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                      `,
                    },
                    {
                      ...KAI_ACTIONS.SWAP_INPUT_AMOUNT_IN,
                      arg: {
                        tokenIn: token,
                      },
                    },
                  ]
                }

                return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
              },
            },
          ]
        }

        return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
  SWAP_INPUT_AMOUNT_IN: {
    title: '👉 Input amount of token you want to sell',
    type: ActionType.TEXT,
    placeholder: 'Enter the amount in',
    response: ({ answer, arg }: { answer: string; arg: any }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (!isNumber(answer)) return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]

      return [
        {
          ...KAI_ACTIONS.SWAP_INPUT_TOKEN_OUT,
          arg: {
            ...arg,
            amountIn: answer,
          },
        },
      ]
    },
  },
  SWAP_INPUT_TOKEN_OUT: {
    title: '👉 Input the token you want to buy (Token out)',
    type: ActionType.TEXT,
    placeholder: 'Enter the token out',
    response: async ({
      answer,
      chainId,
      whitelistTokenAddress,
      arg,
      quoteSymbol,
    }: {
      answer: string
      chainId: number
      whitelistTokenAddress: string[]
      arg: any
      quoteSymbol: string
    }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      const filter: any = {
        chainId: chainId,
        search: answer,
        page: 1,
        pageSize: 50,
        chainIds: chainId,
        sort: '',
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_TOKEN_API_URL}/v1/public/assets?` + new URLSearchParams(filter).toString(),
          {
            method: 'GET',
          },
        )
        const { data } = await res.json()
        const result = data.assets
          .filter(
            (token: any) =>
              token.marketCap && token.tokens.find((item: any) => whitelistTokenAddress.includes(item.address)),
          )
          .map((token: any) => ({
            ...token,
            token: token.tokens.find(
              (item: any) => item.chainId === chainId.toString() && whitelistTokenAddress.includes(item.address),
            ),
          }))
          .filter((token: any) => token.token)
          .sort((a: any, b: any) => b.marketCap - a.marketCap)

        if (result.length === 1) {
          const token = result[0]
          const showAddress = answer !== token.token.address.toLowerCase()

          return [
            {
              type: ActionType.HTML,
              title: `
                <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">📌 ${
                  showAddress ? `Token contract: ${token.token.address}` : token.symbol
                }</div>
                <div>📈 Buy Price: ${
                  token.token.priceBuy
                    ? `${formatDisplayNumber(token.token.priceBuy, {
                        fractionDigits: 2,
                        significantDigits: 7,
                      })} ${quoteSymbol}`
                    : '--'
                }</div>
              `,
            },
            KAI_ACTIONS.SWAP_INPUT_SLIPPAGE_TEXT,
            {
              ...KAI_ACTIONS.SWAP_INPUT_SLIPPAGE,
              arg: {
                ...arg,
                tokenOut: token,
              },
            },
          ]
        } else if (result.length > 1) {
          return [
            KAI_ACTIONS.TOKEN_FOUND,
            {
              type: ActionType.OPTION,
              data: result
                .map((item: any) => ({
                  title: item.symbol,
                  space: item.symbol.length <= 10 ? Space.HALF_WIDTH : Space.FULL_WIDTH,
                }))
                .concat(KAI_ACTIONS.INVALID_BACK_TO_MENU.data),
              response: ({ answer: tokenSymbolSelected }: { answer: string }) => {
                if (tokenSymbolSelected === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

                const token = result.find((item: any) => item.symbol.toLowerCase() === tokenSymbolSelected)

                if (token) {
                  const showAddress = answer !== token.token.address.toLowerCase()

                  return [
                    {
                      type: ActionType.HTML,
                      title: `
                        <div style="width: 100%; word-wrap: break-word; margin-bottom: 4px">📌 ${
                          showAddress ? `Token contract: ${token.token.address}` : token.symbol
                        }</div>
                        <div>📈 Buy Price: ${
                          token.token.priceBuy
                            ? `${formatDisplayNumber(token.token.priceBuy, {
                                fractionDigits: 2,
                                significantDigits: 7,
                              })} ${quoteSymbol}`
                            : '--'
                        }</div>
                      `,
                    },
                    KAI_ACTIONS.SWAP_INPUT_SLIPPAGE_TEXT,
                    {
                      ...KAI_ACTIONS.SWAP_INPUT_SLIPPAGE,
                      arg: {
                        ...arg,
                        tokenOut: token,
                      },
                    },
                  ]
                }

                return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
              },
            },
          ]
        }

        return [KAI_ACTIONS.TOKEN_NOT_FOUND, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      } catch (error) {
        return [KAI_ACTIONS.ERROR, KAI_ACTIONS.INVALID_BACK_TO_MENU]
      }
    },
  },
  SWAP_INPUT_SLIPPAGE_TEXT: {
    title: '👉 Choose max slippage you want to set',
    type: ActionType.TEXT,
  },
  SWAP_INPUT_SLIPPAGE: {
    type: ActionType.OPTION,
    data: [0.1, 0.5, 1, 5, 10]
      .map(item => ({ title: `${item} %`, space: Space.ONE_THIRD_WIDTH }))
      .concat([KAI_OPTIONS.CUSTOM_MAX_SLIPPAGE]),
    response: ({ answer, arg, quoteSymbol }: { answer: string; arg: any; quoteSymbol: string }) => {
      if (answer === KAI_OPTIONS.CUSTOM_MAX_SLIPPAGE.title.toLowerCase())
        return [{ ...KAI_ACTIONS.CUSTOM_MAX_SLIPPAGE, arg }]

      if (['0.1 %', '0.5 %', '1 %', '5 %', '10 %'].includes(answer)) {
        const slippage = answer.replace('%', '')
        return [
          {
            type: ActionType.HTML,
            title: `
              <div style="margin-bottom: 4px">🔄 You're swapping: ${arg.amountIn} of ${
              arg.tokenIn.symbol
            }, est. ${quoteSymbol} value ${arg.tokenIn.token.priceSell * arg.amountIn}</div>
              <div style="margin-bottom: 4px">💰 For: ${
                (arg.amountIn * arg.tokenIn.token.priceSell) / arg.tokenIn.token.priceBuy
              } of ${arg.tokenOut.symbol}, est. ${quoteSymbol} value ${arg.amountIn * arg.tokenIn.token.priceSell}</div>
              <div style="margin-bottom: 4px">⚖️ Slippage tolerance: ${slippage}%</div>
              <div style="margin-bottom: 4px">📝 Min receive: --</div>
              <div>📉 Price Impact: --</div>
            `,
          },
          KAI_ACTIONS.CONFIRM_SWAP_TOKEN_TEXT,
          {
            ...KAI_ACTIONS.CONFIRM_SWAP_TOKEN,
            arg: { ...arg, slippage },
          },
        ]
      }

      return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]
    },
  },
  CUSTOM_MAX_SLIPPAGE: {
    title: '👉 Input max slippage you can to set (in percent)',
    type: ActionType.TEXT,
    placeholder: 'Enter the max slippage',
    response: ({ answer, arg, quoteSymbol }: { answer: string; arg: any; quoteSymbol: string }) => {
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]
      if (!isNumber(answer)) return [KAI_ACTIONS.INVALID, KAI_ACTIONS.INVALID_BACK_TO_MENU]

      return [
        {
          type: ActionType.HTML,
          title: `
            <div style="margin-bottom: 4px">🔄 You're awapping: ${arg.amountIn} of ${
            arg.tokenIn.symbol
          }, est. ${quoteSymbol} value ${arg.tokenIn.token.priceSell * arg.amountIn}</div>
            <div style="margin-bottom: 4px">💰 For: ${
              (arg.amountIn * arg.tokenIn.token.priceSell) / arg.tokenOut.token.priceBuy
            } of ${arg.tokenOut.symbol}, est. ${quoteSymbol} value ${arg.amountIn * arg.tokenIn.token.priceSell}</div>
            <div style="margin-bottom: 4px">⚖️ Slippage tolerance: ${answer}%</div>
            <div style="margin-bottom: 4px">📝 Min receive: --</div>
            <div>📉 Price Impact: --</div>
          `,
        },
        KAI_ACTIONS.CONFIRM_SWAP_TOKEN_TEXT,
        {
          ...KAI_ACTIONS.CONFIRM_SWAP_TOKEN,
          arg: {
            ...arg,
            slippage: answer,
          },
        },
      ]
    },
  },
  CONFIRM_SWAP_TOKEN_TEXT: {
    title: 'Ready to execute the trade❓',
    type: ActionType.TEXT,
  },
  CONFIRM_SWAP_TOKEN: {
    type: ActionType.OPTION,
    data: [KAI_OPTIONS.CONFIRM_SWAP, KAI_OPTIONS.BACK_TO_MENU],
    response: ({ answer, arg }: { answer: string; arg: any }) => {
      console.log(arg)
      if (answer === KAI_OPTIONS.BACK_TO_MENU.title.toLowerCase()) return [KAI_ACTIONS.MAIN_MENU]

      return [KAI_ACTIONS.COMING_SOON, KAI_ACTIONS.BACK_TO_MENU]
    },
  },
}
