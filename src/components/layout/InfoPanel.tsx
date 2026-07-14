import { useState, useMemo } from 'react'
import { X, BookOpen, FileCode, Terminal, GraduationCap, ChevronDown, ChevronRight, Copy, Check, AlertTriangle, Bug } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { getDiagramById } from '@/data/registry'

type Tab = 'overview' | 'yaml' | 'kubectl' | 'interview'

/** Right panel: component details, YAML, kubectl, interview questions */
export default function InfoPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  const selectedId = useAppStore(s => s.selectedComponentId)
  const setSelected = useAppStore(s => s.setSelectedComponent)
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const panelCollapsed = useAppStore(s => s.panelCollapsed)

  const diagram = getDiagramById(activeDiagramId)
  const component = useMemo(() => {
    if (!selectedId || !diagram) return null
    return diagram.nodes.find(n => n.id === selectedId) || null
  }, [selectedId, diagram])

  if (panelCollapsed || !component) {
    return (
      <aside
        style={{
          gridArea: 'panel',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-default)',
          opacity: selectedId ? 1 : 0.5,
        }}
      >
        {!selectedId && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--fg-muted)' }}>
            <BookOpen size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: '12px' }}>Click a component to view details</p>
          </div>
        )}
      </aside>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'yaml', label: 'YAML', icon: FileCode },
    { key: 'kubectl', label: 'kubectl', icon: Terminal },
    { key: 'interview', label: 'Interview', icon: GraduationCap },
  ]

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <aside
      className="animate-slide-in-right"
      style={{
        gridArea: 'panel',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-default)',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: component.color }}>
            {component.name}
          </h3>
          {component.shortName && component.shortName !== component.name && (
            <span style={{ fontSize: '11px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
              {component.shortName}
            </span>
          )}
        </div>
        <button
          onClick={() => setSelected(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        padding: '0 8px',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 10px',
                border: 'none',
                borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
                background: 'transparent',
                color: active ? 'var(--accent-blue)' : 'var(--fg-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Description */}
            <div>
              <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--fg-secondary)' }}>
                {component.description}
              </p>
            </div>

            {/* Responsibilities */}
            {component.responsibilities.length > 0 && (
              <div>
                <h4 style={sectionHeading}>Responsibilities</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {component.responsibilities.map((r, i) => (
                    <li key={i} style={listItem}>
                      <span style={{ color: component.color }}>▸</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ports */}
            {component.ports && component.ports.length > 0 && (
              <div>
                <h4 style={sectionHeading}>Ports</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {component.ports.map((p, i) => (
                    <span key={i} style={badge}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Objects */}
            {component.relatedObjects && component.relatedObjects.length > 0 && (
              <div>
                <h4 style={sectionHeading}>Related Objects</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {component.relatedObjects.map((r, i) => (
                    <span key={i} style={{ ...badge, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Debugging Tips */}
            {component.debuggingTips && component.debuggingTips.length > 0 && (
              <div>
                <h4 style={sectionHeading}>
                  <Bug size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Debugging Tips
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {component.debuggingTips.map((t, i) => (
                    <li key={i} style={{ ...listItem, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Failure Scenarios */}
            {component.failureScenarios && component.failureScenarios.length > 0 && (
              <div>
                <h4 style={sectionHeading}>
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Failure Scenarios
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {component.failureScenarios.map((f, i) => (
                    <li key={i} style={{ ...listItem, color: 'var(--accent-yellow)' }}>
                      ⚠ {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* YAML TAB */}
        {activeTab === 'yaml' && (
          <div>
            {component.yamlExample ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => handleCopy(component.yamlExample!, 0)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: copiedIdx === 0 ? 'var(--accent-green)' : 'var(--fg-muted)',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedIdx === 0 ? <Check size={10} /> : <Copy size={10} />}
                  {copiedIdx === 0 ? 'Copied!' : 'Copy'}
                </button>
                <pre
                  style={{
                    background: 'rgba(6, 10, 20, 0.8)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    overflow: 'auto',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.5',
                    color: 'var(--fg-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {component.yamlExample}
                </pre>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                <FileCode size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>No YAML example available for this component.</p>
              </div>
            )}
          </div>
        )}

        {/* KUBECTL TAB */}
        {activeTab === 'kubectl' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {component.kubectlCommands && component.kubectlCommands.length > 0 ? (
              component.kubectlCommands.map((cmd, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(6, 10, 20, 0.8)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}>
                    <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      $ {cmd.command}
                    </code>
                    <button
                      onClick={() => handleCopy(cmd.command, i + 100)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedIdx === i + 100 ? 'var(--accent-green)' : 'var(--fg-dim)',
                        padding: '2px',
                      }}
                    >
                      {copiedIdx === i + 100 ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--fg-muted)', margin: 0 }}>
                    {cmd.description}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                <Terminal size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>No kubectl commands available.</p>
              </div>
            )}
          </div>
        )}

        {/* INTERVIEW TAB */}
        {activeTab === 'interview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {component.interviewQuestions && component.interviewQuestions.length > 0 ? (
              component.interviewQuestions.map((qa, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: expandedQ === i ? 'rgba(139, 92, 246, 0.08)' : 'rgba(6, 10, 20, 0.5)',
                      color: expandedQ === i ? 'var(--accent-purple)' : 'var(--fg-secondary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                      fontWeight: 500,
                      lineHeight: '1.4',
                    }}
                  >
                    {expandedQ === i ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {qa.question}
                  </button>
                  {expandedQ === i && (
                    <div
                      className="animate-fade-in"
                      style={{
                        padding: '12px',
                        fontSize: '11px',
                        lineHeight: '1.6',
                        color: 'var(--fg-secondary)',
                        borderTop: '1px solid var(--border-default)',
                        background: 'rgba(6, 10, 20, 0.3)',
                      }}
                    >
                      {qa.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                <GraduationCap size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>No interview questions available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

/* ===== Shared styles ===== */
const sectionHeading: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
}

const listItem: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '1.5',
  color: 'var(--fg-secondary)',
  padding: '3px 0',
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
}

const badge: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-mono)',
  padding: '2px 8px',
  borderRadius: '999px',
  background: 'rgba(148, 163, 184, 0.1)',
  color: 'var(--fg-secondary)',
  border: '1px solid var(--border-default)',
}
