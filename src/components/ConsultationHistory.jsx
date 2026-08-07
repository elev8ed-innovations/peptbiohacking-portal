import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ConsultationHistory.css'

const emptyProtocol = [{ name: '', dose: '', frequency: '' }]

function protocolRows(value) {
  return Array.isArray(value) && value.length > 0
    ? value.map(item => ({ name: item?.name || '', dose: item?.dose || '', frequency: item?.frequency || '' }))
    : emptyProtocol
}

function formatDate(value, withTime = false) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-MX', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ConsultationHistory({
  patientId,
  consultations,
  bodyMetrics,
  loading,
  error,
  initialConsultationId,
  onRefresh,
}) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(initialConsultationId || '')
  const [editing, setEditing] = useState(false)
  const [annulling, setAnnulling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [revisions, setRevisions] = useState([])
  const [form, setForm] = useState({ chief_complaint: '', notes: '', peptide_protocol: emptyProtocol, correction_reason: '' })
  const [voidReason, setVoidReason] = useState('')

  const selected = useMemo(
    () => consultations.find(item => item.id === selectedId) || consultations[0] || null,
    [consultations, selectedId],
  )
  const linkedMetrics = useMemo(
    () => bodyMetrics.filter(metric => metric.consultation_id === selected?.id),
    [bodyMetrics, selected?.id],
  )

  useEffect(() => {
    if (!selectedId && consultations[0]?.id) setSelectedId(consultations[0].id)
    if (selectedId && consultations.length > 0 && !consultations.some(item => item.id === selectedId)) {
      setSelectedId(consultations[0].id)
    }
  }, [consultations, selectedId])

  useEffect(() => {
    if (!selected?.id) { setRevisions([]); return }
    let active = true
    supabase
      .from('consultation_revisions')
      .select('id, change_type, reason, changed_by, created_at')
      .eq('consultation_id', selected.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (active) setRevisions(data || []) })
    return () => { active = false }
  }, [selected?.id, selected?.updated_at])

  const beginEdit = () => {
    setForm({
      chief_complaint: selected.chief_complaint || '',
      notes: selected.notes || '',
      peptide_protocol: protocolRows(selected.peptide_protocol),
      correction_reason: '',
    })
    setActionError('')
    setEditing(true)
  }

  const updateProtocol = (index, field, value) => {
    setForm(current => ({
      ...current,
      peptide_protocol: current.peptide_protocol.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  const saveCorrection = async () => {
    if (!form.correction_reason.trim() || saving) return
    setSaving(true)
    setActionError('')
    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        chief_complaint: form.chief_complaint.trim(),
        notes: form.notes.trim(),
        peptide_protocol: form.peptide_protocol.filter(item => item.name.trim()),
        correction_reason: form.correction_reason.trim(),
      })
      .eq('id', selected.id)
      .eq('patient_id', patientId)
      .select('id')
      .single()

    if (updateError) {
      setActionError(updateError.message || 'No se pudo guardar la corrección.')
    } else {
      await onRefresh()
      setEditing(false)
    }
    setSaving(false)
  }

  const annulConsultation = async () => {
    if (!voidReason.trim() || saving) return
    setSaving(true)
    setActionError('')
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ status: 'voided', void_reason: voidReason.trim() })
      .eq('id', selected.id)
      .eq('patient_id', patientId)
      .select('id')
      .single()

    if (updateError) {
      setActionError(updateError.message || 'No se pudo anular la consulta.')
    } else {
      await onRefresh()
      setAnnulling(false)
      setVoidReason('')
    }
    setSaving(false)
  }

  if (loading) return <div className="consult-state"><i />Cargando consultas…</div>
  if (error) return <div className="consult-state error"><strong>No se pudo cargar el historial</strong><span>{error}</span><button onClick={onRefresh}>Reintentar</button></div>
  if (consultations.length === 0) {
    return <div className="consult-state empty"><b>＋</b><strong>Aún no hay consultas clínicas guardadas</strong><span>Las mediciones existentes permanecen seguras en Progreso. Una medición no crea automáticamente una consulta.</span><button onClick={() => navigate(`/doctor/new-consultation?patient_id=${patientId}`)}>Registrar primera consulta</button></div>
  }

  return (
    <div className="consult-history">
      <aside className="consult-list-panel">
        <header><div><span>EXPEDIENTE CLÍNICO</span><h2>Consultas anteriores</h2></div><b>{consultations.length}</b></header>
        <button className="consult-new" onClick={() => navigate(`/doctor/new-consultation?patient_id=${patientId}`)}>＋ Nueva consulta</button>
        <div className="consult-list">
          {consultations.map(item => (
            <button key={item.id} className={`${selected?.id === item.id ? 'active' : ''} ${item.status === 'voided' ? 'voided' : ''}`} onClick={() => { setSelectedId(item.id); setEditing(false); setActionError('') }}>
              <div><strong>{formatDate(item.created_at)}</strong><span>{item.status === 'voided' ? 'Anulada' : 'Completada'}</span></div>
              <p>{item.chief_complaint || 'Consulta clínica sin motivo capturado'}</p>
              <small>{protocolRows(item.peptide_protocol).filter(row => row.name).map(row => row.name).join(' · ') || 'Sin protocolo capturado'}</small>
            </button>
          ))}
        </div>
      </aside>

      {editing ? (
        <section className="consult-detail consult-edit">
          <header><div><span>CORRECCIÓN CONTROLADA</span><h2>Editar consulta</h2><p>{formatDate(selected.created_at, true)} · La versión anterior quedará protegida</p></div></header>
          <label><span>Motivo de consulta</span><textarea rows="3" value={form.chief_complaint} onChange={event => setForm(current => ({ ...current, chief_complaint: event.target.value }))} /></label>
          <label><span>Notas clínicas</span><textarea rows="6" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></label>
          <div className="consult-protocol-edit">
            <span>Protocolo indicado</span>
            {form.peptide_protocol.map((row, index) => <div key={index}><input aria-label={`Péptido ${index + 1}`} placeholder="Péptido" value={row.name} onChange={event => updateProtocol(index, 'name', event.target.value)} /><input aria-label={`Dosis ${index + 1}`} placeholder="Dosis" value={row.dose} onChange={event => updateProtocol(index, 'dose', event.target.value)} /><input aria-label={`Frecuencia ${index + 1}`} placeholder="Frecuencia" value={row.frequency} onChange={event => updateProtocol(index, 'frequency', event.target.value)} /><button onClick={() => setForm(current => ({ ...current, peptide_protocol: current.peptide_protocol.filter((_, itemIndex) => itemIndex !== index) }))}>×</button></div>)}
            <button onClick={() => setForm(current => ({ ...current, peptide_protocol: [...current.peptide_protocol, { name: '', dose: '', frequency: '' }] }))}>＋ Agregar péptido</button>
          </div>
          <label><span>Motivo de la corrección <b>obligatorio</b></span><input placeholder="Ej. Corrección de dosis capturada" value={form.correction_reason} onChange={event => setForm(current => ({ ...current, correction_reason: event.target.value }))} /></label>
          <div className="consult-safety"><strong>Historial protegido</strong> Se registrará el médico, la fecha, el motivo y la versión anterior completa.</div>
          {actionError && <p className="consult-action-error">{actionError}</p>}
          <footer className="consult-form-actions"><button onClick={() => setEditing(false)}>Cancelar</button><button className="primary" disabled={saving || !form.correction_reason.trim()} onClick={saveCorrection}>{saving ? 'Guardando…' : 'Guardar corrección'}</button></footer>
        </section>
      ) : (
        <section className="consult-detail">
          <header><div><span>CONSULTA CLÍNICA</span><h2>{formatDate(selected.created_at)}</h2><p>{formatDate(selected.created_at, true)} · Expediente de solo lectura</p></div><b className={selected.status === 'voided' ? 'voided' : ''}>{selected.status === 'voided' ? 'Anulada' : 'Completada'}</b></header>
          {selected.status === 'voided' && <div className="consult-void-banner"><strong>Consulta anulada</strong><span>{selected.void_reason}</span></div>}
          <div className="consult-actions"><button disabled={selected.status === 'voided'} onClick={beginEdit}>✎ Corregir consulta</button><button className="danger" disabled={selected.status === 'voided'} onClick={() => { setAnnulling(true); setActionError('') }}>Anular…</button></div>
          <article><span>MOTIVO DE CONSULTA</span><p>{selected.chief_complaint || 'Sin motivo capturado.'}</p></article>
          <article><span>NOTAS CLÍNICAS</span><p>{selected.notes || 'Sin notas clínicas capturadas.'}</p></article>
          <article><span>PROTOCOLO INDICADO</span><div className="consult-protocol">{protocolRows(selected.peptide_protocol).filter(row => row.name).length === 0 ? <p>Sin protocolo capturado.</p> : protocolRows(selected.peptide_protocol).filter(row => row.name).map((row, index) => <div key={`${row.name}-${index}`}><strong>{row.name}</strong><span>{row.dose || 'Sin dosis'}</span><span>{row.frequency || 'Sin frecuencia'}</span></div>)}</div></article>
          <article><span>MEDICIONES VINCULADAS</span>{linkedMetrics.length === 0 ? <p className="consult-muted">No hay mediciones vinculadas explícitamente a esta consulta. Las mediciones históricas siguen disponibles en Progreso.</p> : <div className="consult-linked-metrics">{linkedMetrics.map(metric => <div key={metric.id}><small>{formatDate(metric.recorded_at)}</small><strong>{metric.weight_kg ?? '—'} kg</strong><span>IMC {metric.bmi ?? '—'} · Grasa {metric.body_fat_pct ?? '—'}%</span></div>)}</div>}</article>
          <article><span>HISTORIAL DE CAMBIOS</span>{revisions.length === 0 ? <p className="consult-muted">Sin correcciones ni anulaciones.</p> : <div className="consult-revisions">{revisions.map(revision => <div key={revision.id}><strong>{revision.change_type === 'void' ? 'Consulta anulada' : 'Corrección clínica'}</strong><span>{revision.reason}</span><small>{formatDate(revision.created_at, true)}</small></div>)}</div>}</article>
          {actionError && <p className="consult-action-error">{actionError}</p>}
        </section>
      )}

      {annulling && <div className="consult-modal-backdrop"><div className="consult-modal" role="dialog" aria-modal="true"><b>!</b><h3>Anular esta consulta</h3><p>El expediente no será borrado. Quedará marcado como anulado y conservará su versión original para trazabilidad clínica.</p><label><span>Motivo obligatorio</span><textarea rows="3" placeholder="Describe por qué se anula…" value={voidReason} onChange={event => setVoidReason(event.target.value)} /></label>{actionError && <p className="consult-action-error">{actionError}</p>}<footer><button onClick={() => { setAnnulling(false); setVoidReason('') }}>Cancelar</button><button className="danger" disabled={saving || !voidReason.trim()} onClick={annulConsultation}>{saving ? 'Anulando…' : 'Confirmar anulación'}</button></footer></div></div>}
    </div>
  )
}
