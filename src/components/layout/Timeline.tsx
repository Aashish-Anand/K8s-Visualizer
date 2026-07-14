import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

/** Bottom timeline with step indicators and scrubber for animation playback */
export default function Timeline() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const currentStepIndex = useAppStore(s => s.currentStepIndex)
  const isPlaying = useAppStore(s => s.isPlaying)
  const playbackSpeed = useAppStore(s => s.playbackSpeed)
  const goToStep = useAppStore(s => s.goToStep)
  const nextStep = useAppStore(s => s.nextStep)
  const pause = useAppStore(s => s.pause)

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
  const currentStep = steps[currentStepIndex]

  return (
    <footer
      style={{
        gridArea: 'timeline',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-default)',
        padding: '8px 20px',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* Current step info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg-primary)' }}>
          {currentStep?.title || ''}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--fg-muted)' }}>
          Step {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', height: '28px', display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '3px',
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
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
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
                width: isCurrent ? '14px' : '8px',
                height: isCurrent ? '14px' : '8px',
                borderRadius: '50%',
                border: isCurrent
                  ? '2px solid var(--accent-blue)'
                  : isPast
                  ? '2px solid var(--accent-cyan)'
                  : '2px solid var(--fg-dim)',
                background: isCurrent
                  ? 'var(--accent-blue)'
                  : isPast
                  ? 'var(--accent-cyan)'
                  : 'var(--bg-secondary)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
                boxShadow: isCurrent ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
                zIndex: isCurrent ? 2 : 1,
              }}
            />
          )
        })}
      </div>

      {/* Step description */}
      <div style={{
        fontSize: '10px',
        color: 'var(--fg-muted)',
        lineHeight: '1.4',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {currentStep?.description || ''}
      </div>
    </footer>
  )
}
