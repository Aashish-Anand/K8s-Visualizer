import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

/** Glassmorphic floating narration card overlaid on the 3D viewport */
export default function NarrationCard() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const currentStepIndex = useAppStore(s => s.currentStepIndex)
  const isPlaying = useAppStore(s => s.isPlaying)
  const playbackSpeed = useAppStore(s => s.playbackSpeed)
  const nextStep = useAppStore(s => s.nextStep)
  const goToStep = useAppStore(s => s.goToStep)
  const pause = useAppStore(s => s.pause)
  const togglePlay = useAppStore(s => s.togglePlay)

  const [minimized, setMinimized] = useState(false)
  const [animateClass, setAnimateClass] = useState('')
  const prevStepRef = useRef(currentStepIndex)

  const diagram = getDiagramById(activeDiagramId)
  const steps = diagram?.steps || []
  const totalSteps = steps.length
  const currentStep = steps[currentStepIndex] || null

  /* Trigger transition animation on step change */
  useEffect(() => {
    if (currentStepIndex !== prevStepRef.current) {
      setAnimateClass('narration-exit')
      const timer = setTimeout(() => {
        setAnimateClass('narration-enter')
        prevStepRef.current = currentStepIndex
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex])

  /* Reset animation class after entry completes */
  useEffect(() => {
    if (animateClass === 'narration-enter') {
      const timer = setTimeout(() => setAnimateClass(''), 300)
      return () => clearTimeout(timer)
    }
  }, [animateClass])

  /* Auto-advance when playing */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return

    const currentStepData = steps[currentStepIndex]
    const duration = currentStepData ? currentStepData.duration / playbackSpeed : 3000

    timerRef.current = setTimeout(() => {
      if (currentStepIndex < totalSteps - 1) {
        nextStep()
      } else {
        pause()
      }
    }, duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed, nextStep, pause, steps])

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          if (currentStepIndex < totalSteps - 1) goToStep(currentStepIndex + 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (currentStepIndex > 0) goToStep(currentStepIndex - 1)
          break
        case ' ':
          e.preventDefault()
          togglePlay()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentStepIndex, totalSteps, goToStep, togglePlay])

  if (totalSteps === 0 || !currentStep) return null

  const progress = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 100


  if (minimized) {
    return (
      <div style={styles.minimizedPill}>
        <span style={styles.minimizedStep}>
          {currentStepIndex + 1}/{totalSteps}
        </span>
        <span style={styles.minimizedTitle}>
          {currentStep.title}
        </span>
        <button
          onClick={() => setMinimized(false)}
          style={styles.iconButton}
          title="Expand narration"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container} className={animateClass}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.stepBadge}>
          Step {currentStepIndex + 1} of {totalSteps}
        </div>
        <button
          onClick={() => setMinimized(true)}
          style={styles.iconButton}
          title="Minimize"
        >
          <Minimize2 size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>


      {/* Title */}
      <h3 style={styles.title}>{currentStep.title}</h3>

      {/* Description */}
      <p style={styles.description}>{currentStep.description}</p>

      {/* Focus points */}
      {currentStep.focusPoints && currentStep.focusPoints.length > 0 && (
        <div style={styles.focusSection}>
          <span style={styles.focusLabel}>What's happening:</span>
          <ul style={styles.focusList}>
            {currentStep.focusPoints.map((point, i) => (
              <li key={i} style={styles.focusItem}>
                <span style={styles.focusBullet}>▸</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div style={styles.nav}>
        <button
          onClick={() => goToStep(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          style={{
            ...styles.navButton,
            opacity: currentStepIndex === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <div style={styles.dots}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              style={{
                ...styles.dot,
                background: i === currentStepIndex
                  ? 'var(--accent-cyan, #06b6d4)'
                  : i < currentStepIndex
                  ? 'var(--accent-blue, #3b82f6)'
                  : 'rgba(148, 163, 184, 0.2)',
                transform: i === currentStepIndex ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => nextStep()}
          disabled={currentStepIndex >= totalSteps - 1}
          style={{
            ...styles.navButton,
            opacity: currentStepIndex >= totalSteps - 1 ? 0.3 : 1,
          }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* ===== Styles ===== */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    width: '360px',
    maxWidth: 'calc(100% - 40px)',
    background: 'rgba(10, 15, 28, 0.82)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '16px',
    padding: '16px 18px 14px',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(148, 163, 184, 0.2)',
    zIndex: 20,
    fontFamily: "'Outfit', system-ui, sans-serif",
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  stepBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
    borderRadius: '20px',
    padding: '2px 10px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  },
  iconButton: {
    background: 'rgba(148, 163, 184, 0.08)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '6px',
    padding: '4px',
    cursor: 'pointer',
    color: 'rgba(148, 163, 184, 0.6)',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  progressTrack: {
    height: '2px',
    background: 'rgba(148, 163, 184, 0.1)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    borderRadius: '999px',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
  },

  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e2e8f0',
    margin: '0 0 6px',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '12px',
    lineHeight: 1.6,
    color: 'rgba(148, 163, 184, 0.85)',
    margin: '0 0 10px',
  },
  focusSection: {
    background: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.12)',
    borderRadius: '10px',
    padding: '8px 10px',
    marginBottom: '10px',
  },
  focusLabel: {
    fontSize: '9px',
    fontWeight: 600,
    color: 'rgba(148, 163, 184, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '4px',
  },
  focusList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  focusItem: {
    fontSize: '11px',
    color: 'rgba(226, 232, 240, 0.8)',
    lineHeight: 1.5,
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
  },
  focusBullet: {
    color: '#06b6d4',
    fontSize: '10px',
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(148, 163, 184, 0.06)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '8px',
    padding: '5px 10px',
    cursor: 'pointer',
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: '11px',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.3s ease',
  },
  minimizedPill: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '20px',
    background: 'rgba(10, 15, 28, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '24px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 20,
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  minimizedStep: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.1)',
    borderRadius: '12px',
    padding: '1px 6px',
  },
  minimizedTitle: {
    fontSize: '11px',
    color: '#e2e8f0',
    fontWeight: 500,
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
}
