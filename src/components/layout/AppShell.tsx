import Sidebar from './Sidebar'
import Toolbar from './Toolbar'
import InfoPanel from './InfoPanel'
import NarrationCard from './NarrationCard'
import Scene from '@/components/three/Scene'
import { useAppStore } from '@/stores/useAppStore'

/** Main layout grid orchestrator */
export default function AppShell() {
  const panelCollapsed = useAppStore(s => s.panelCollapsed)

  return (
    <div className={`app-shell${panelCollapsed ? ' panel-collapsed' : ''}`}>
      <Toolbar />
      <Sidebar />
      <main style={{ gridArea: 'canvas', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <Scene />
        <NarrationCard />
      </main>
      <InfoPanel />
    </div>
  )
}
