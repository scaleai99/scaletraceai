import React from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * PageErrorBoundary - wraps each route to catch rendering errors.
 * Instead of a blank white screen, shows a friendly error card with
 * the error message and a Reload button.
 */
export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PageErrorBoundary] Caught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg w-full shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">!</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {this.props.fallbackTitle ?? 'Page failed to render'}
                </h2>
                <p className="text-xs text-gray-500">
                  An unexpected error occurred in this section.
                </p>
              </div>
            </div>

            {this.state.error && (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-red-700 overflow-x-auto mb-4 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
