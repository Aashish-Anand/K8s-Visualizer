import { useMemo } from 'react'
import { Server, Rocket, Globe, Search, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { diagramRegistry, getDiagramById } from '@/data/registry'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/utils/colors'

const ICON_MAP: Record<string, typeof Server> = { Server, Rocket, Globe }

/** Left sidebar: diagram selector, search, legend, component tree */
export default function Sidebar() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const setActiveDiagram = useAppStore(s => s.setActiveDiagram)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const selectedComponentId = useAppStore(s => s.selectedComponentId)
  const setSelectedComponent = useAppStore(s => s.setSelectedComponent)
  const setFocusTarget = useAppStore(s => s.setFocusTarget)

  const diagram = getDiagramById(activeDiagramId)

  /* Group nodes by category */
  const groupedNodes = useMemo(() => {
    if (!diagram) return {}
    const query = searchQuery.toLowerCase()
    const filtered = diagram.nodes.filter(n =>
      !query || n.name.toLowerCase().includes(query) || n.id.toLowerCase().includes(query)
    )
    const groups: Record<string, typeof filtered> = {}
    for (const node of filtered) {
      const cat = node.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(node)
    }
    return groups
  }, [diagram, searchQuery])

  return (
    <aside
      style={{
        gridArea: 'sidebar',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-default)',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-default)' }}>
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
          className="text-gradient"
        >
          K8s Explorer
        </h1>
        <p style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '2px' }}>
          Interactive Architecture Visualizer
        </p>
      </div>

      {/* Diagram Selector */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
        <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Diagram
        </label>
        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {diagramRegistry.map(d => {
            const Icon = ICON_MAP[d.icon] || Server
            const active = d.id === activeDiagramId
            return (
              <button
                key={d.id}
                onClick={() => setActiveDiagram(d.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: active ? 'var(--accent-blue)' : 'var(--fg-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%',
                }}
              >
                <Icon size={14} />
                <div>
                  <div style={{ fontWeight: active ? 600 : 400 }}>{d.name}</div>
                  {active && (
                    <div style={{ fontSize: '10px', color: 'var(--fg-muted)', marginTop: '1px' }}>
                      {d.description}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Search size={13} color="var(--fg-muted)" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--fg-primary)',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
        <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Legend
        </label>
        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: 'var(--fg-secondary)',
              }}
            >
              <Circle size={8} fill={color} color={color} />
              {CATEGORY_LABELS[key] || key}
            </div>
          ))}
        </div>
      </div>

      {/* Component Tree */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 16px 24px 16px' }}>
        <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Components
        </label>
        <div style={{ marginTop: '8px' }}>
          {Object.entries(groupedNodes).map(([category, nodes]) => (
            <div key={category} style={{ marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: CATEGORY_COLORS[category] || 'var(--fg-secondary)',
                  padding: '4px 0',
                }}
              >
                <ChevronDown size={12} />
                {CATEGORY_LABELS[category] || category}
                <span style={{ fontSize: '10px', color: 'var(--fg-dim)', fontWeight: 400, marginLeft: '4px' }}>
                  ({nodes.length})
                </span>
              </div>
              {nodes.map(node => {
                const isActive = selectedComponentId === node.id
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedComponent(node.id)
                      setFocusTarget(node.position)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px 4px 20px',
                      width: '100%',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? `${node.color}15` : 'transparent',
                      color: isActive ? node.color : 'var(--fg-secondary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Circle size={6} fill={node.color} color={node.color} />
                    {node.shortName || node.name}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
