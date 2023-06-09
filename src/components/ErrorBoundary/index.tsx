import { captureException } from '@sentry/react'
import React, { ErrorInfo, PropsWithChildren } from 'react'

import FallbackView from 'components/ErrorBoundary/FallbackView'

type ErrorBoundaryState = {
  error: Error | null
}

// use this component if you don't want to crash app (ex: is third party error)
export class ErrorBoundaryV2 extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.log('error local component', error.name)
  }

  render() {
    return this.props.children
  }
}

export default class ErrorBoundary extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('error.name', error.name)
    if (
      error.name === 'ChunkLoadError' ||
      /Loading .*?chunk .*? failed/.test(error.message) ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.stack?.includes('Failed to fetch dynamically imported module')
    ) {
      const e = new Error(`[ChunkLoadError] ${error.message}`)
      e.name = 'ChunkLoadError'
      e.stack = ''
      captureException(e, { level: 'warning', extra: { error, errorInfo } })
      return window.location.reload()
    }

    const e = new Error(`[${error.name}] ${error.message}`, {
      cause: error,
    })
    e.name = 'AppCrash'
    e.stack = ''
    captureException(e, { level: 'fatal', extra: { error, errorInfo } })
  }

  render() {
    const { error } = this.state

    if (error !== null) {
      return <FallbackView error={error} />
    }

    return this.props.children
  }
}
