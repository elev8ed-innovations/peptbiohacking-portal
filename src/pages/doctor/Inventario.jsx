import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const STATUS_CONFIG = {
  'In Stock': { icon: '🟢', color: '#3EAD7A', bg: 'rgba(62,173,122,0.1)', border: 'rgba(62,173,122,0.3)' },
  'Low Stock': { icon: '🟡', color: '#D9A13B', bg: 'rgba(217,161,59,0.1)', border: 'rgba(217,161,59,0.3)' },
  'Out of Stock': { icon: '🔴', color: '#DC4A5A', bg: 'rgba(220,74,90,0.1)', border: 'rgba(220,74,90,0.3)' },
}

function getStatus(stock, estado) {
  if (estado && (estado.includes('OK') || estado.includes('🟢'))) return 'In Stock'
  if (stock <= 0) return 'Out of Stock'
  if (stock <= 10) return 'Low Stock'
  return 'In Stock'
}

function formatPrice(price) {
  if (!price || price === 0) return '—'
  return '$' + Number(price).toLocaleString('es-MX')
}

export default function Inventario() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [openTickets, setOpenTickets] = useState(0)
  const [doctorName, setDoctorName] = useState('')

  // Ticket form
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')
  const [ticketPriority, setTicketPriority] = useState('Normal')
  const [ticketProduct, setTicketProduct] = useState('')
  const [ticketSaving, setTicketSaving] = useState(false)
  const [ticketMsg, setTicketMsg] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch('/.netlify/functions/get-inventory')
        const data = await resp.json()
        const mapped = (data.products || []).map(p => ({
          ...p,
          status: getStatus(p.stock, p.estado)
        }))
        setProducts(mapped)
        setFiltered(mapped)
        setOpenTickets(data.openTickets || 0)
      } catch (e) {
        console.error('Failed to load inventory:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = products
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.peptido.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') {
      result = result.filter(p => {
        if (filterStatus === 'in') return p.status === 'In Stock'
        if (filterStatus === 'low') return p.status === 'Low Stock'
        if (filterStatus === 'out') return p.status === 'Out of Stock'
        return true
      })
    }
    setFiltered(result)
  }, [search, filterStatus, products])

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.status === 'In Stock').length,
    lowStock: products.filter(p => p.status === 'Low Stock').length,
    outOfStock: products.filter(p => p.status === 'Out of Stock').length,
  }

  const submitTicket = async () => {
    const title = ticketProduct
      ? `INVENTARIO: ${ticketProduct} — ${ticketTitle || 'Sin detalle'}`
      : ticketTitle
    if (!title.trim()) {
      setTicketMsg({ type: 'err', text: 'Escribe un título o selecciona un producto' })
      return
    }
    setTicketSaving(true)
    setTicketMsg(null)
    try {
      const resp = await fetch('/.netlify/functions/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: title,
          descripcion: ticketDesc,
          prioridad: ticketPriority,
          reporta: 'Dr. V',
        }),
      })
      const data = await resp.json()
      if (data.success) {
        setTicketMsg({ type: 'ok', text: '✅ Ticket enviado — Ari lo revisará' })
        setTicketTitle('')
        setTicketDesc('')
        setTicketProduct('')
        setTicketPriority('Normal')
        setOpenTickets(o => o + 1)
        setTimeout(() => setTicketMsg(null), 4000)
      } else {
        setTicketMsg({ type: 'err', text: 'Error al enviar ticket' })
      }
    } catch {
      setTicketMsg({ type: 'err', text: 'Error de conexión' })
    }
    setTicketSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="doctor" />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/doctor/dashboard')} style={{
            background: '#fff', border: '1px solid #E5E5E5', borderRadius: '10px',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#0A1628', cursor: 'pointer', fontSize: '18px', flexShrink: 0,
          }}>←</button>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
              INVENTARIO
            </p>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', color: '#0A1628', margin: 0 }}>
              {'Panel de Inventario'}
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: stats.total, color: '#0A1628', bg: '#fff' },
            { label: 'Disponible', value: stats.inStock, color: '#3EAD7A', bg: 'rgba(62,173,122,0.08)' },
            { label: 'Stock Bajo', value: stats.lowStock, color: '#D9A13B', bg: 'rgba(217,161,59,0.08)' },
            { label: 'Agotado', value: stats.outOfStock, color: '#DC4A5A', bg: 'rgba(220,74,90,0.08)' },
            { label: 'Tickets Abiertos', value: openTickets, color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.35 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              style={{
                width: '100%', padding: '11px 14px 11px 40px', minHeight: '44px',
                background: '#fff', border: '1px solid #E5E5E5', borderRadius: '10px',
                color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'in', label: '🟢 Disponible' },
              { key: 'low', label: '🟡 Bajo' },
              { key: 'out', label: '🔴 Agotado' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{
                padding: '8px 14px', minHeight: '36px',
                background: filterStatus === f.key ? '#0A1628' : '#fff',
                border: filterStatus === f.key ? 'none' : '1px solid #E5E5E5',
                borderRadius: '8px', color: filterStatus === f.key ? '#fff' : '#2A2A2A',
                fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: filterStatus === f.key ? 600 : 400,
                cursor: 'pointer',
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Product Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div style={{ width: '36px', height: '36px', border: '2px solid #E5E5E5', borderTop: '2px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
                {search ? 'No se encontraron productos' : 'Inventario vacío'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E5E5', background: '#FAF7F2' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Producto</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Precio</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['In Stock']
                    return (
                      <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F5F4F0' : 'none' }}>
                        <td style={{ padding: '12px 16px', color: '#0A1628', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                          {p.peptido}
                          {p.unidad && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '6px', fontWeight: 400, fontSize: '12px' }}>({p.unidad})</span>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: p.stock <= 0 ? '#DC4A5A' : p.stock <= 10 ? '#D9A13B' : '#1A2A2A' }}>
                          {p.stock}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 600, color: '#0A1628' }}>
                          {formatPrice(p.precio)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '999px',
                            fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          }}>
                            {cfg.icon} {p.status === 'In Stock' ? 'Disponible' : p.status === 'Low Stock' ? 'Stock Bajo' : 'Agotado'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ticket Form */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 4px' }}>
            {'🎫 Reportar un problema'}
          </h3>
          <p style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '13px', margin: '0 0 20px' }}>
            {'Reporta productos agotados, precios incorrectos o cualquier incidencia — Ari lo revisará'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>Producto (opcional)</label>
              <select
                value={ticketProduct}
                onChange={e => setTicketProduct(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', minHeight: '44px',
                  background: '#FAF7F2', border: '1px solid #E5E5E5', borderRadius: '10px',
                  color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                }}
              >
                <option value="">— Seleccionar producto —</option>
                {products.map(p => (
                  <option key={p.id} value={p.peptido}>
                    {p.peptido} — {formatPrice(p.precio)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>Prioridad</label>
              <select
                value={ticketPriority}
                onChange={e => setTicketPriority(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', minHeight: '44px',
                  background: '#FAF7F2', border: '1px solid #E5E5E5', borderRadius: '10px',
                  color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                }}
              >
                <option value="Baja">🔵 Baja</option>
                <option value="Normal">🟡 Normal</option>
                <option value="Alta">🔴 Alta</option>
                <option value="Urgente">⚠️ Urgente</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>Título</label>
            <input
              value={ticketTitle}
              onChange={e => setTicketTitle(e.target.value)}
              placeholder="Ej: El producto X está agotado y no se actualiza"
              style={{
                width: '100%', padding: '10px 12px', minHeight: '44px',
                background: '#FAF7F2', border: '1px solid #E5E5E5', borderRadius: '10px',
                color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>Descripción (opcional)</label>
            <textarea
              value={ticketDesc}
              onChange={e => setTicketDesc(e.target.value)}
              placeholder="Describe el problema con más detalle..."
              rows="2"
              style={{
                width: '100%', padding: '10px 12px', minHeight: '44px',
                background: '#FAF7F2', border: '1px solid #E5E5E5', borderRadius: '10px',
                color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={submitTicket}
              disabled={ticketSaving}
              style={{
                padding: '12px 28px', minHeight: '48px',
                background: 'linear-gradient(135deg, #C9A84C, #B8922E)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer', opacity: ticketSaving ? 0.45 : 1,
              }}
            >{ticketSaving ? 'Enviando...' : 'Enviar Reporte'}</button>
            {ticketMsg && (
              <span style={{
                fontSize: '13px', fontFamily: 'Outfit, sans-serif',
                color: ticketMsg.type === 'ok' ? '#3EAD7A' : '#DC4A5A',
              }}>{ticketMsg.text}</span>
            )}
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}