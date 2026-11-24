import { Outlet } from 'react-router-dom'
import { QuickCapture } from './QuickCapture'
import { Sidebar } from './Sidebar'

/** Sidebar + main content. Below 900px the sidebar stacks on top. */
export function PageShell() {
  return (
    <div className="mc-dots min-h-screen flex flex-col min-[900px]:flex-row">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 pt-6 pb-10">
        <div className="mx-auto max-w-[1240px] flex flex-col gap-6">
          <Outlet />
        </div>
      </main>
      <QuickCapture />
    </div>
  )
}
