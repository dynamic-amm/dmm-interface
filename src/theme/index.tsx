import { lighten } from 'polished'
import React from 'react'
import { Text, TextProps } from 'rebass'
import styled, {
  DefaultTheme,
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
} from 'styled-components'

import { Colors, colors } from './color'

export * from './components'

export const MEDIA_WIDTHS = {
  upToXXSmall: 420,
  upToExtraSmall: 576,
  upToSmall: 768,
  upToMedium: 992,
  upToLarge: 1200,
  upToXL: 1400,
  upToXXL: 1800,
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = (
  Object.keys(MEDIA_WIDTHS) as (keyof typeof MEDIA_WIDTHS)[]
).reduce((accumulator, size) => {
  accumulator[size] = (a: any, b: any, c: any) => css`
    @media (max-width: ${MEDIA_WIDTHS[size]}px) {
      ${css(a, b, c)}
    }
  `
  return accumulator
}, {} as { [width in keyof typeof MEDIA_WIDTHS]: typeof css })

function theme(): DefaultTheme {
  return {
    ...colors(),

    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `,
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <StyledComponentsThemeProvider theme={theme()}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text)<{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]} !important;
`

export const TYPE = {
  main(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'subText'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'white'} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text'} {...props} />
  },
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  h3(props: TextProps) {
    return <TextWrapper fontSize={'18px'} fontWeight={500} color={'#E1F5FE'} lineheight={'21px'} my={0} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'yellow1'} {...props} />
  },
  warning(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'warning'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'bg3'} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'text2'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...props} />
  },
}

export const FixedGlobalStyle = createGlobalStyle`
  html, input, textarea, button {
    font-family: 'Work Sans', 'Inter', sans-serif;
    font-display: fallback;
  }

  @supports (font-variation-settings: normal) {
    html, input, textarea, button {
      font-family: 'Work Sans', 'Inter var', sans-serif;
    }
  }

  html,
  body {
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: none;
  }

  a {
    color: ${colors().primary};
    text-decoration: none;
    :hover{
      color: ${lighten(0.2, colors().primary)};
    }
  }

  * {
    box-sizing: border-box;
  }

  button {
    user-select: none;
  }

  html {
    font-size: 16px;
    font-variant: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;

  }
`

export const ThemedGlobalStyle = createGlobalStyle`
  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */

  html {
    color: ${({ theme }) => theme.text};
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  body {
    min-height: 100vh;
    background: ${({ theme }) => theme.buttonBlack};
  }

  .staked-only-switch {
    box-shadow: 0 0 0 2px;
    background: ${({ theme }) => theme.background} !important;
  }

  .staked-only-switch[aria-checked="false"] div {
    background: ${({ theme }) => theme.border} !important;
  }

  .staked-only-switch div {
    background: ${({ theme }) => theme.primary};
  }

  #language-selector {
    &:focus-visible {
      outline-width: 0;
    }
  }

  .grecaptcha-badge {
    visibility: hidden;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield; /* Firefox */
  }

  .tv-lightweight-charts{
    width: 100% !important;

    & > * {
      width: 100% !important;
    }
  }

  .zkme-widget-mask {
    position: fixed;
  }
  
  coinbasewallet-subscribe::part(modal-dialog) {
    padding: 24px;
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
  }

  coinbasewallet-subscribe::part(modal-title) {
    font-size: 24px;
  }

  coinbasewallet-subscribe::part(subscribe-toggle) {
    background: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.textReverse};
    font-size: 16px;
  }
  
  coinbasewallet-subscribe::part(close-button) {
    top: 24px;
    right: 24px;

    filter: invert(96%) sepia(4%) saturate(18%) hue-rotate(177deg) brightness(105%) contrast(104%);
  }

  coinbasewallet-subscribe::part(qr-code) {
    background: #ffffff;
  }

  
  coinbasewallet-subscribe::part(subscribe-confirmation) {
    padding-right: 1.5rem;
  }

  .ks-lw-modal-overlay {
    z-index: 9999
  }

  .ks-lw {
    width: 100%;
    /* max-width: 900px; */
  }

`
