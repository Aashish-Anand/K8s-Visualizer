import { useMemo, useState } from 'react'
import { Server, Rocket, Globe, Search, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { diagramRegistry, getDiagramById } from '@/data/registry'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/utils/colors'

const ICON_MAP: Record<string, typeof Server> = { Server, Rocket, Globe }

/** Left sidebar: diagram selector, search, component tree */
export default function Sidebar() {
  const activeDiagramId = useAppStore(s => s.activeDiagramId)
  const setActiveDiagram = useAppStore(s => s.setActiveDiagram)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const selectedComponentId = useAppStore(s => s.selectedComponentId)
  const setSelectedComponent = useAppStore(s => s.setSelectedComponent)
  const setFocusTarget = useAppStore(s => s.setFocusTarget)

  const [diagramSelectorOpen, setDiagramSelectorOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const diagram = getDiagramById(activeDiagramId)
  const activeDiagram = diagramRegistry.find(d => d.id === activeDiagramId)

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

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

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

      {/* Collapsible Diagram Selector */}
      <div style={{ borderBottom: '1px solid var(--border-default)' }}>
        <button
          onClick={() => setDiagramSelectorOpen(!diagramSelectorOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--fg-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          {diagramSelectorOpen ? <ChevronDown size={12} color="var(--fg-muted)" /> : <ChevronRight size={12} color="var(--fg-muted)" />}
          <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
            Diagram
          </label>
          {!diagramSelectorOpen && activeDiagram && (
            <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 500, marginLeft: 'auto' }}>
              {activeDiagram.name}
            </span>
          )}
        </button>

        {diagramSelectorOpen && (
          <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {diagramRegistry.map(d => {
              const Icon = ICON_MAP[d.icon] || Server
              const active = d.id === activeDiagramId
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setActiveDiagram(d.id)
                    setDiagramSelectorOpen(false)
                  }}
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
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-default)' }}>
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

      {/* Component Tree (legend colors are inline with category headers) */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '10px 16px 24px 16px' }}>
        <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Components
        </label>
        <div style={{ marginTop: '6px' }}>
          {Object.entries(groupedNodes).map(([category, nodes]) => {
            const isCollapsed = collapsedCategories.has(category)
            const catColor = CATEGORY_COLORS[category] || 'var(--fg-secondary)'
            return (
              <div key={category} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: catColor,
                    padding: '4px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <Circle size={7} fill={catColor} color={catColor} style={{ flexShrink: 0 }} />
                  {CATEGORY_LABELS[category] || category}
                  <span style={{ fontSize: '10px', color: 'var(--fg-dim)', fontWeight: 400, marginLeft: '4px' }}>
                    ({nodes.length})
                  </span>
                </button>
                {!isCollapsed && nodes.map(node => {
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
                        padding: '4px 8px 4px 24px',
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
                      <Circle size={5} fill={node.color} color={node.color} />
                      {node.shortName || node.name}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
