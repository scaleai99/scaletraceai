import { Outlet } from 'react-router-dom'
import { LeftNav } from './LeftNav'
import { TopBar } from './TopBar'
import { CopilotPanel } from '../copilot/CopilotPanel'
import { ServiceBanner } from '../ServiceBanner'
import { PageErrorBoundary } from './PageErrorBoundary'

export function AppShell() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <LeftNav />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <ServiceBanner />
        <main className="flex-1 overflow-auto p-4 pb-24 bg-white">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
      <CopilotPanel />
    </div>
  )
}


