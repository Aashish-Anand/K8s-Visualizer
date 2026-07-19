import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

/** Minimal bottom timeline scrubber — step dots + progress track + keyboard hints */
export default function Timeline() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const currentStepIndex = useAppStore(s => s.currentStepIndex)
  const isPlaying = useAppStore(s => s.isPlaying)
  const playbackSpeed = useAppStore(s => s.playbackSpeed)
  const goToStep = useAppStore(s => s.goToStep)
  const nextStep = useAppStore(s => s.nextStep)
  const pause = useAppStore(s => s.pause)
  const togglePlay = useAppStore(s => s.togglePlay)

  const diagram = getDiagramById(activeDiagramId)
  const steps = diagram?.steps || []
  const totalSteps = steps.length
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Auto-advance when playing */
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return

    const currentStep = steps[currentStepIndex]
    const duration = currentStep ? currentStep.duration / playbackSpeed : 3000

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

  const handleStepClick = useCallback((index: number) => {
    goToStep(index)
  }, [goToStep])

  if (totalSteps === 0) {
    return (
      <footer
        style={{
          gridArea: 'timeline',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-default)',
          color: 'var(--fg-dim)',
          fontSize: '11px',
        }}
      >
        Select an animated diagram to see the timeline
      </footer>
    )
  }

  const progress = ((currentStepIndex) / (totalSteps - 1)) * 100

  return (
    <footer
      style={{
        gridArea: 'timeline',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-default)',
        padding: '0 20px',
        minHeight: 0,
      }}
    >
      {/* Keyboard hints */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
      }}>
        <kbd style={kbdStyle}>←</kbd>
        <kbd style={kbdStyle}>→</kbd>
        <kbd style={{ ...kbdStyle, padding: '1px 8px' }}>Space</kbd>
      </div>

      {/* Progress bar with dots */}
      <div style={{ flex: 1, position: 'relative', height: '28px', display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--bg-tertiary)',
            borderRadius: '999px',
            transform: 'translateY(-50%)',
          }}
        >
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
            }}
          />
        </div>

        {/* Step dots */}
        {steps.map((step, i) => {
          const x = totalSteps > 1 ? (i / (totalSteps - 1)) * 100 : 50
          const isCurrent = i === currentStepIndex
          const isPast = i < currentStepIndex

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(i)}
              title={step.title}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: isCurrent ? '12px' : '6px',
                height: isCurrent ? '12px' : '6px',
                borderRadius: '50%',
                border: isCurrent
                  ? '2px solid var(--accent-cyan)'
                  : 'none',
                background: isCurrent
                  ? 'var(--accent-cyan)'
                  : isPast
                  ? 'var(--accent-blue)'
                  : 'var(--fg-dim)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isCurrent ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                zIndex: isCurrent ? 2 : 1,
              }}
            />
          )
        })}
      </div>

      {/* Step counter */}
      <span style={{ fontSize: '10px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        {currentStepIndex + 1}/{totalSteps}
      </span>
    </footer>
  )
}

const kbdStyle: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'var(--font-mono)',
  padding: '1px 4px',
  borderRadius: '3px',
  background: 'rgba(148, 163, 184, 0.08)',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  color: 'var(--fg-dim)',
}
