import { CrossChain } from '../pages/cross-chain.po.cy'
import { LimitOder } from '../pages/limit-order.po.cy'
import { Network, SwapPage, TokenCatalog } from '../pages/swap-page.po.cy'
import {
  DEFAULT_NETWORK,
  DEFAULT_URL,
  NETWORK,
  NORESULTS_TEXT,
  NOTOKENS_TEXT,
  TAG,
  UNWHITELIST_TOKENS,
} from '../selectors/constants.cy'

const unWhitelistTokens = UNWHITELIST_TOKENS[NETWORK]

const tokenAddresses = [unWhitelistTokens[0].address, unWhitelistTokens[1].address, unWhitelistTokens[2].address]
const tokenSymbols = [unWhitelistTokens[0].symbol, unWhitelistTokens[1].symbol, unWhitelistTokens[2].symbol]

const tokenCatalog = new TokenCatalog()
const wallet = new Network()

describe(`Swap ${NETWORK}`, () => {
  before(() => {
    SwapPage.open(DEFAULT_URL)
    SwapPage.connectWallet()
    cy.acceptMetamaskAccess()
    SwapPage.getStatusConnectedWallet()
  })

  describe('Swap', () => {
    it('Redirects to swap page when a user has already connected a wallet', { tags: TAG.regression }, () => {
      cy.url().should('include', '/swap')
      cy.intercept('GET', '**/routes?**').as('get-route')
      cy.wait('@get-route', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 404, 408])
    })
    it('verify the default pair', () => {
      SwapPage.getCurrentTokenIn(text => {
        expect(text).to.equal('ETH')
      })
      SwapPage.getCurrentTokenOut(text => {
        expect(text).to.equal('USDT')
      })
    })
    it('able select token in', { tags: TAG.smoke }, () => {
      SwapPage.selectTokenIn().selectTokenBySymbol('USDC')
      SwapPage.getCurrentTokenIn(text => {
        expect(text).to.equal('USDC')
      })
    })

    it('able to select token out', { tags: TAG.smoke }, () => {
      SwapPage.selectTokenOut().selectTokenBySymbol('USDC')
      SwapPage.getCurrentTokenOut(text => {
        expect(text).to.equal('USDC')
      })
    })

    it('able to set amount in', { tags: TAG.smoke }, () => {
      SwapPage.setAmountIn('100')
      SwapPage.getAmountIn().should('eq', '100')
    })

    it('able to search, import token as normal', () => {
      tokenCatalog.importNewTokens([tokenAddresses[2]])
      SwapPage.getCurrentTokenIn(text => {
        expect(text).to.equal(tokenSymbols[2])
      })

      SwapPage.selectTokenOut().getFavoriteTokens(arr => {
        tokenCatalog.selectFavoriteToken(arr[1])
        SwapPage.getCurrentTokenOut(text => {
          expect(text).to.equal(arr[1])
        })
      })

      SwapPage.selectTokenOut().deleteImportedToken(tokenSymbols[2])
      tokenCatalog.getNoResultsFound(text => {
        expect(text).to.equal(NORESULTS_TEXT)
      })
      SwapPage.getCurrentTokenIn(text => {
        expect(text).to.equal(NOTOKENS_TEXT)
      })
    })

    it.skip('Should approve permission to switch network', () => {
      if (NETWORK !== DEFAULT_NETWORK) {
        wallet.selectNetwork(NETWORK)
        cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
          expect(approved).to.be.true
        })
      }
      cy.wait(2000)
      SwapPage.getBalanceWallet(value => {
        const balance = value.split(' ')[0]
        if (balance !== '0') {
          SwapPage.getCurrentBalanceIn(value => {
            expect(Number(value)).to.be.greaterThan(0)
          })
        }
      })
    })
    afterEach(() => {
      cy.reload()
    })
  })
  describe('Limit Order', () => {
    before('navigate to limit oder', () => {
      SwapPage.goToLimitOrder()
      LimitOder.clickGetStarted()
    })
    it('able to select sell token', { tags: TAG.smoke }, () => {
      LimitOder.selectTokenSell().selectTokenBySymbol('USDC')
      LimitOder.getCurrentTokenSell(text => {
        expect(text).to.equal('USDC')
      })
    })

    it('able to select buy token', { tags: TAG.smoke }, () => {
      LimitOder.selectTokenBuy().selectTokenBySymbol('USDC')
      LimitOder.getCurrentTokenBuy(text => {
        expect(text).to.equal('USDC')
      })
    })

    it('able to set selling rate by number', { tags: TAG.smoke }, () => {
      LimitOder.setSellingRate('2')
      LimitOder.getSellingRate().then(value => {
        cy.wrap(value).should('eq', '2')
      })
    })

    it('able to set sell amount', { tags: TAG.smoke }, () => {
      LimitOder.selectTokenSell().selectTokenBySymbol('USDC')
      LimitOder.setSellAmount('100')
      LimitOder.getSellAmount().should('eq', '100')
    })

    it('able to set buy amount', () => {
      LimitOder.selectTokenBuy().selectTokenBySymbol('USDC')
      LimitOder.setBuyAmount('100')
      LimitOder.getBuyAmount().should('eq', '100')
    })

    it('verify error message when insufficient balance', () => {
      LimitOder.getBalanceIn(text => {
        LimitOder.setSellAmount(String(Number(text) + 1))
        LimitOder.getInsufficientErrorMessage().should('be.visible')
      })
    })
    afterEach(() => {
      cy.reload()
    })
  })

  describe('Cross-chain', { tags: TAG.regression }, () => {
    it('The network should be changed successfully', () => {
      SwapPage.goToCrossChain()
      CrossChain.checkLoadedPage().then(checked => {
        if (checked === true) {
          CrossChain.closeUnderstandPopup()
        }
      })
      const networkIn = CrossChain.changeNetwork([NETWORK])
      CrossChain.selectNetworkIn(networkIn)
      if (networkIn != DEFAULT_NETWORK) {
        cy.allowMetamaskToAddAndSwitchNetwork().then(approved => {
          expect(approved).to.be.true
        })
      } else {
        cy.allowMetamaskToSwitchNetwork().then(approved => {
          expect(approved).to.be.true
        })
      }
      CrossChain.getCurrentNetworkIn().then(currentNetworkIn => {
        expect(currentNetworkIn).to.equal(networkIn)
      })

      CrossChain.getCurrentNetworkOut().then(currentNetworkOut => {
        const networkOut = CrossChain.changeNetwork([networkIn, currentNetworkOut])
        cy.wait(1000)
        CrossChain.selectNetworkOut(networkOut)
        CrossChain.getCurrentNetworkOut().then(currentNetworkOut => {
          expect(currentNetworkOut).to.equal(networkOut)
        })
      })
    })
  })
})
