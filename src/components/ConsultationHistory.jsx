import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toNumber, validateBodyMetricInput } from '../lib/healthMetrics'
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
  initialEntryKey,
  onRefresh,
  onRefreshBodyMetrics,
}) {
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState(
    initialEntryKey || (initialConsultationId ? `consultation:${initialConsultationId}` : ''),
  )
  const [editing, setEditing] = useState(false)
  const [annulling, setAnnulling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [revisions, setRevisions] = useState([])
  const [form, setForm] = useState({ chief_complaint: '', notes: '', peptide_protocol: emptyProtocol, correction_reason: '' })
  const [voidReason, setVoidReason] = useState('')
  const [metricEditing, setMetricEditing] = useState(false)
  const [metricAnnulling, setMetricAnnulling] = useState(false)
  const [metricRevisions, setMetricRevisions] = useState([])
  const [metricVoidReason, setMetricVoidReason] = useState('')
  const [metricForm, setMetricForm] = useState({
    weight_kg: '', height_cm: '', body_fat_pct: '', bmi: '', bmi_override: false,
    bmi_override_reason: '', muscle_kg: '', waist_cm: '', notes: '', correction_reason: '',
  })

  const historyEntries = useMemo(
    () => [
      ...consultations.map(record => ({ key: `consultation:${record.id}`, kind: 'consultation', occurredAt: record.created_at, record })),
      ...bodyMetrics.map(record => ({ key: `metric:${record.id}`, kind: 'metric', occurredAt: record.recorded_at, record })),
    ].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0)),
    [consultations, bodyMetrics],
  )
  const selectedEntry = useMemo(
    () => historyEntries.find(item => item.key === selectedKey) || historyEntries[0] || null,
    [historyEntries, selectedKey],
  )
  const selected = selectedEntry?.kind === 'consultation' ? selectedEntry.record : null
  const selectedMetric = selectedEntry?.kind === 'metric' ? selectedEntry.record : null
  const linkedMetrics = useMemo(
    () => bodyMetrics.filter(metric => metric.consultation_id === selected?.id),
    [bodyMetrics, selected?.id],
  )

  useEffect(() => {
    if (initialEntryKey && historyEntries.some(item => item.key === initialEntryKey)) {
      setSelectedKey(initialEntryKey)
    }
  }, [historyEntries, initialEntryKey])

  useEffect(() => {
    if (!selectedKey && historyEntries[0]?.key) setSelectedKey(historyEntries[0].key)
    if (selectedKey && historyEntries.length > 0 && !historyEntries.some(item => item.key === selectedKey)) {
      setSelectedKey(historyEntries[0].key)
    }
  }, [historyEntries, selectedKey])

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

  useEffect(() => {
    if (!selectedMetric?.id) { setMetricRevisions([]); return }
    let active = true
    supabase
      .from('body_metric_revisions')
      .select('id, change_type, reason, changed_by, created_at')
      .eq('body_metric_id', selectedMetric.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (active) setMetricRevisions(data || []) })
    return () => { active = false }
  }, [selectedMetric?.id, selectedMetric?.updated_at])

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

  const beginMetricEdit = () => {
    setMetricForm({
      weight_kg: selectedMetric.weight_kg ?? '',
      height_cm: selectedMetric.height_cm ?? '',
      body_fat_pct: selectedMetric.body_fat_pct ?? '',
      bmi: selectedMetric.bmi ?? '',
      bmi_override: Boolean(selectedMetric.bmi_override),
      bmi_override_reason: selectedMetric.bmi_override_reason || '',
      muscle_kg: selectedMetric.muscle_kg ?? '',
      waist_cm: selectedMetric.waist_cm ?? '',
      notes: selectedMetric.notes || '',
      correction_reason: '',
    })
    setActionError('')
    setMetricEditing(true)
  }

  const saveMetricCorrection = async () => {
    if (!metricForm.correction_reason.trim() || saving) return
    const validationError = validateBodyMetricInput(metricForm)
    if (validationError) { setActionError(validationError); return }
    setSaving(true)
    setActionError('')
    const numeric = field => toNumber(metricForm[field])
    const { error: updateError } = await supabase
      .from('body_metrics')
      .update({
        weight_kg: numeric('weight_kg'),
        height_cm: numeric('height_cm'),
        body_fat_pct: numeric('body_fat_pct'),
        muscle_kg: numeric('muscle_kg'),
        waist_cm: numeric('waist_cm'),
        notes: metricForm.notes.trim() || null,
        bmi: metricForm.bmi_override ? numeric('bmi') : null,
        bmi_override: metricForm.bmi_override,
        bmi_override_reason: metricForm.bmi_override ? metricForm.bmi_override_reason.trim() : null,
        correction_reason: metricForm.correction_reason.trim(),
      })
      .eq('id', selectedMetric.id)
      .eq('patient_id', patientId)
      .select('id')
      .single()

    if (updateError) {
      setActionError(updateError.message || 'No se pudo guardar la corrección.')
    } else {
      await onRefreshBodyMetrics()
      setMetricEditing(false)
    }
    setSaving(false)
  }

  const annulMetric = async () => {
    if (!metricVoidReason.trim() || saving) return
    setSaving(true)
    setActionError('')
    const { error: updateError } = await supabase
      .from('body_metrics')
      .update({ status: 'voided', void_reason: metricVoidReason.trim() })
      .eq('id', selectedMetric.id)
      .eq('patient_id', patientId)
      .select('id')
      .single()

    if (updateError) {
      setActionError(updateError.message || 'No se pudo anular el registro.')
    } else {
      await onRefreshBodyMetrics()
      setMetricAnnulling(false)
      setMetricVoidReason('')
    }
    setSaving(false)
  }

  if (loading) return <div className="consult-state"><i />Cargando consultas…</div>
  if (error) return <div className="consult-state error"><strong>No se pudo cargar el historial</strong><span>{error}</span><button onClick={onRefresh}>Reintentar</button></div>
  if (historyEntries.length === 0) {
    return <div className="consult-state empty"><b>＋</b><strong>Aún no hay registros clínicos guardados</strong><span>Las nuevas consultas y mediciones aparecerán aquí sin cambiar su registro original.</span><button onClick={() => navigate(`/doctor/new-consultation?patient_id=${patientId}`)}>Registrar primera consulta</button></div>
  }

  return (
    <div className="consult-history">
      <aside className="consult-list-panel">
        <header><div><span>EXPEDIENTE CLÍNICO</span><h2>Historial clínico</h2><p>Consultas y registros de progreso</p></div><b>{historyEntries.length}</b></header>
        <button className="consult-new" onClick={() => navigate(`/doctor/new-consultation?patient_id=${patientId}`)}>＋ Nueva consulta</button>
        <div className="consult-list">
          {historyEntries.map(entry => {
            const item = entry.record
            const isConsultation = entry.kind === 'consultation'
            return (
              <button key={entry.key} className={`${selectedEntry?.key === entry.key ? 'active' : ''} ${item.status === 'voided' ? 'voided' : ''}`} onClick={() => { setSelectedKey(entry.key); setEditing(false); setAnnulling(false); setMetricEditing(false); setMetricAnnulling(false); setActionError('') }}>
                <div><strong>{formatDate(entry.occurredAt)}</strong><span className={isConsultation ? '' : 'metric'}>{item.status === 'voided' ? 'Anulado' : (isConsultation ? 'Consulta' : 'Progreso')}</span></div>
                <p>{isConsultation ? (item.chief_complaint || 'Consulta clínica sin motivo capturado') : (item.notes || 'Mediciones corporales registradas')}</p>
                <small>{isConsultation ? (protocolRows(item.peptide_protocol).filter(row => row.name).map(row => row.name).join(' · ') || 'Sin protocolo capturado') : [item.weight_kg != null ? `${item.weight_kg} kg` : '', item.bmi != null ? `IMC ${item.bmi}` : '', item.body_fat_pct != null ? `Grasa ${item.body_fat_pct}%` : ''].filter(Boolean).join(' · ') || 'Registro de progreso'}</small>
              </button>
            )
          })}
        </div>
      </aside>

      {selectedMetric && metricEditing ? (
        <section className="consult-detail consult-edit">
          <header><div><span>CORRECCIÓN CONTROLADA</span><h2>Corregir progreso</h2><p>{formatDate(selectedMetric.recorded_at, true)} · La versión anterior quedará protegida</p></div></header>
          <div className="consult-metric-edit-grid">
            {[
              ['weight_kg', 'Peso (kg)'], ['height_cm', 'Estatura (cm)'], ['body_fat_pct', 'Grasa corporal (%)'],
              ['muscle_kg', 'Masa muscular (kg)'], ['waist_cm', 'Cintura (cm)'],
            ].map(([field, label]) => <label key={field}><span>{label}</span><input type="number" step="0.1" value={metricForm[field]} onChange={event => setMetricForm(current => ({ ...current, [field]: event.target.value }))} /></label>)}
          </div>
          <label className="consult-bmi-toggle"><input type="checkbox" checked={metricForm.bmi_override} onChange={event => setMetricForm(current => ({ ...current, bmi_override: event.target.checked, bmi_override_reason: event.target.checked ? current.bmi_override_reason : '' }))} /><span>Ajuste médico manual del IMC</span></label>
          {metricForm.bmi_override && <div className="consult-metric-edit-grid bmi"><label><span>IMC manual</span><input type="number" step="0.1" value={metricForm.bmi} onChange={event => setMetricForm(current => ({ ...current, bmi: event.target.value }))} /></label><label><span>Justificación del IMC</span><input value={metricForm.bmi_override_reason} onChange={event => setMetricForm(current => ({ ...current, bmi_override_reason: event.target.value }))} /></label></div>}
          <label><span>Notas del registro</span><textarea rows="4" value={metricForm.notes} onChange={event => setMetricForm(current => ({ ...current, notes: event.target.value }))} /></label>
          <label><span>Motivo de la corrección <b>obligatorio</b></span><input placeholder="Ej. Corrección de peso capturado" value={metricForm.correction_reason} onChange={event => setMetricForm(current => ({ ...current, correction_reason: event.target.value }))} /></label>
          <div className="consult-safety"><strong>Historial protegido</strong> Se conservará la versión anterior completa, el médico, la fecha y el motivo de la corrección.</div>
          {actionError && <p className="consult-action-error">{actionError}</p>}
          <footer className="consult-form-actions"><button onClick={() => setMetricEditing(false)}>Cancelar</button><button className="primary" disabled={saving || !metricForm.correction_reason.trim()} onClick={saveMetricCorrection}>{saving ? 'Guardando…' : 'Guardar corrección'}</button></footer>
        </section>
      ) : selectedMetric ? (
        <section className="consult-detail metric-detail">
          <header><div><span>REGISTRO DE PROGRESO</span><h2>{formatDate(selectedMetric.recorded_at)}</h2><p>{formatDate(selectedMetric.recorded_at, true)} · Registro histórico preservado</p></div><b className={selectedMetric.status === 'voided' ? 'voided' : 'metric'}>{selectedMetric.status === 'voided' ? 'Anulado' : 'Progreso'}</b></header>
          {selectedMetric.status === 'voided' && <div className="consult-void-banner"><strong>Registro anulado</strong><span>{selectedMetric.void_reason}</span></div>}
          <div className="consult-record-notice"><strong>Registro original protegido</strong><span>Esta información se muestra desde Progreso sin convertirla ni duplicarla como consulta clínica.</span></div>
          <div className="consult-actions"><button disabled={selectedMetric.status === 'voided'} onClick={beginMetricEdit}>✎ Corregir registro</button><button className="danger" disabled={selectedMetric.status === 'voided'} onClick={() => { setMetricAnnulling(true); setActionError('') }}>Anular…</button>{selectedMetric.consultation_id && consultations.some(item => item.id === selectedMetric.consultation_id) && <button onClick={() => setSelectedKey(`consultation:${selectedMetric.consultation_id}`)}>Abrir consulta vinculada →</button>}</div>
          <article><span>MEDICIONES REGISTRADAS</span><div className="consult-metric-grid">
            {[
              ['Peso', selectedMetric.weight_kg, 'kg'],
              ['Estatura', selectedMetric.height_cm, 'cm'],
              ['IMC', selectedMetric.bmi, ''],
              ['Grasa corporal', selectedMetric.body_fat_pct, '%'],
              ['Masa muscular', selectedMetric.muscle_kg, 'kg'],
              ['Cintura', selectedMetric.waist_cm, 'cm'],
            ].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value ?? '—'}{value != null && unit ? ` ${unit}` : ''}</strong></div>)}
          </div></article>
          <article><span>NOTAS DEL REGISTRO</span><p className={selectedMetric.notes ? '' : 'consult-muted'}>{selectedMetric.notes || 'Este registro no contiene notas adicionales.'}</p></article>
          <article><span>HISTORIAL DE CAMBIOS</span>{metricRevisions.length === 0 ? <p className="consult-muted">Sin correcciones ni anulaciones.</p> : <div className="consult-revisions">{metricRevisions.map(revision => <div key={revision.id}><strong>{revision.change_type === 'void' ? 'Registro anulado' : 'Corrección de progreso'}</strong><span>{revision.reason}</span><small>{formatDate(revision.created_at, true)}</small></div>)}</div>}</article>
          {actionError && <p className="consult-action-error">{actionError}</p>}
        </section>
      ) : editing ? (
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
      {metricAnnulling && <div className="consult-modal-backdrop"><div className="consult-modal" role="dialog" aria-modal="true"><b>!</b><h3>Anular este registro</h3><p>Las mediciones no serán borradas. Se excluirán de las gráficas y quedarán conservadas en el historial clínico con trazabilidad.</p><label><span>Motivo obligatorio</span><textarea rows="3" placeholder="Describe por qué se anula…" value={metricVoidReason} onChange={event => setMetricVoidReason(event.target.value)} /></label>{actionError && <p className="consult-action-error">{actionError}</p>}<footer><button onClick={() => { setMetricAnnulling(false); setMetricVoidReason('') }}>Cancelar</button><button className="danger" disabled={saving || !metricVoidReason.trim()} onClick={annulMetric}>{saving ? 'Anulando…' : 'Confirmar anulación'}</button></footer></div></div>}
    </div>
  )
}
