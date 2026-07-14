import {
  Play,
  Pause,
  RotateCcw,
  Tag,
  Expand,
  Box,
  RefreshCw,
  Gauge,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

/** Top toolbar: playback controls, camera, and view toggles */
export default function Toolbar() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const isPlaying = useAppStore(s => s.isPlaying)
  const togglePlay = useAppStore(s => s.togglePlay)
  const playbackSpeed = useAppStore(s => s.playbackSpeed)
  const setSpeed = useAppStore(s => s.setSpeed)
  const resetCamera = useAppStore(s => s.resetCamera)
  const resetPlayback = useAppStore(s => s.resetPlayback)
  const showLabels = useAppStore(s => s.showLabels)
  const toggleLabels = useAppStore(s => s.toggleLabels)
  const explodedView = useAppStore(s => s.explodedView)
  const toggleExplodedView = useAppStore(s => s.toggleExplodedView)
  const wireframeMode = useAppStore(s => s.wireframeMode)
  const toggleWireframe = useAppStore(s => s.toggleWireframe)
  const autoRotate = useAppStore(s => s.autoRotate)
  const toggleAutoRotate = useAppStore(s => s.toggleAutoRotate)

  const diagram = getDiagramById(activeDiagramId)
  const hasAnimation = diagram?.steps && diagram.steps.length > 0

  const speeds = [0.5, 1, 1.5, 2]

  const buttonStyle = (active = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? 'var(--accent-blue)' : 'var(--fg-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  })

  return (
    <header
      style={{
        gridArea: 'toolbar',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 16px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-default)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}
    >
      {/* Diagram name */}
      <div style={{ marginRight: '12px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
          {diagram?.name}
        </h2>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }} />

      {/* Playback controls */}
      {hasAnimation && (
        <>
          <button onClick={togglePlay} style={buttonStyle(isPlaying)}>
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={resetPlayback} style={buttonStyle()}>
            <RotateCcw size={13} />
            Reset
          </button>

          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={13} color="var(--fg-muted)" />
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  ...buttonStyle(playbackSpeed === s),
                  padding: '4px 6px',
                  fontSize: '10px',
                  minWidth: '32px',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }} />
        </>
      )}

      {/* Camera reset */}
      <button onClick={resetCamera} style={buttonStyle()}>
        <RotateCcw size={13} />
        Camera
      </button>

      {/* View toggles */}
      <button onClick={toggleLabels} style={buttonStyle(showLabels)}>
        <Tag size={13} />
        Labels
      </button>
      <button onClick={toggleExplodedView} style={buttonStyle(explodedView)}>
        <Expand size={13} />
        Exploded
      </button>
      <button onClick={toggleWireframe} style={buttonStyle(wireframeMode)}>
        <Box size={13} />
        Wireframe
      </button>
      <button onClick={toggleAutoRotate} style={buttonStyle(autoRotate)}>
        <RefreshCw size={13} />
        Rotate
      </button>
    </header>
  )
}
