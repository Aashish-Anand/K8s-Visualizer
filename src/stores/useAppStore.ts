import { create } from 'zustand'
import type { AnimationStep } from '@/types'
import { getDiagramById } from '@/data/registry'

interface AppState {
  /* Diagram */
  activeDiagramId: string
  setActiveDiagram: (id: string) => void

  /* Selected Component */
  selectedComponentId: string | null
  setSelectedComponent: (id: string | null) => void
  hoveredComponentId: string | null
  setHoveredComponent: (id: string | null) => void

  /* Animation / Playback */
  isPlaying: boolean
  playbackSpeed: number
  currentStepIndex: number
  totalSteps: number
  steps: AnimationStep[]
  play: () => void
  pause: () => void
  togglePlay: () => void
  setSpeed: (speed: number) => void
  goToStep: (index: number) => void
  setSteps: (steps: AnimationStep[]) => void
  nextStep: () => void
  resetPlayback: () => void

  /* View Toggles */
  showLabels: boolean
  toggleLabels: () => void
  explodedView: boolean
  toggleExplodedView: () => void
  wireframeMode: boolean
  toggleWireframe: () => void
  autoRotate: boolean
  toggleAutoRotate: () => void

  /* Camera */
  shouldResetCamera: number
  resetCamera: () => void
  focusTarget: [number, number, number] | null
  setFocusTarget: (target: [number, number, number] | null) => void
  cinematicMode: boolean
  toggleCinematicMode: () => void

  /* Search */
  searchQuery: string
  setSearchQuery: (query: string) => void

  /* Sidebar */
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  /* Panel */
  panelCollapsed: boolean
  togglePanel: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  /* Diagram */
  activeDiagramId: 'cluster-architecture',
  setActiveDiagram: (id) => {
    const diagram = getDiagramById(id)
    const steps = diagram?.steps || []
    set({
      activeDiagramId: id,
      selectedComponentId: null,
      hoveredComponentId: null,
      currentStepIndex: 0,
      isPlaying: false,
      steps,
      totalSteps: steps.length,
    })
  },

  /* Selected Component */
  selectedComponentId: null,
  setSelectedComponent: (id) => set({ selectedComponentId: id, panelCollapsed: id === null }),
  hoveredComponentId: null,
  setHoveredComponent: (id) => set({ hoveredComponentId: id }),

  /* Animation */
  isPlaying: false,
  playbackSpeed: 1,
  currentStepIndex: 0,
  totalSteps: 0,
  steps: [],
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
  goToStep: (index) => {
    const { totalSteps } = get()
    set({ currentStepIndex: Math.max(0, Math.min(index, totalSteps - 1)) })
  },
  setSteps: (steps) => set({ steps, totalSteps: steps.length, currentStepIndex: 0 }),
  nextStep: () => {
    const { currentStepIndex, totalSteps } = get()
    if (currentStepIndex < totalSteps - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    } else {
      set({ isPlaying: false })
    }
  },
  resetPlayback: () => set({ currentStepIndex: 0, isPlaying: false }),

  /* View */
  showLabels: true,
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  explodedView: false,
  toggleExplodedView: () => set((s) => ({ explodedView: !s.explodedView })),
  wireframeMode: false,
  toggleWireframe: () => set((s) => ({ wireframeMode: !s.wireframeMode })),
  autoRotate: false,
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),

  /* Camera */
  shouldResetCamera: 0,
  resetCamera: () => set((s) => ({ shouldResetCamera: s.shouldResetCamera + 1, focusTarget: null })),
  focusTarget: null,
  setFocusTarget: (target) => set({ focusTarget: target }),
  cinematicMode: true,
  toggleCinematicMode: () => set((s) => ({ cinematicMode: !s.cinematicMode })),

  /* Search */
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  /* Sidebar */
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  /* Panel */
  panelCollapsed: true,
  togglePanel: () => set((s) => ({ panelCollapsed: !s.panelCollapsed })),
}))
