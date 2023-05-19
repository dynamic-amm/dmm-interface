import { defineConfig } from 'cypress'

console.log(process.env)

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: `https://kyberswap-interface-${process.env.PR_NUMBER}.pr.kyberengineering.io/`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*-spec.cy.ts',
  },
})
