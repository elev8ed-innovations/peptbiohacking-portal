import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'
import { saveWaiver } from '../lib/waiver'

function CheckBox({ checked, onToggle, title, sub }) {
  return <label style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '18px' }}>
    <input type="checkbox" checked={checked} onChange={onToggle} style={{ width: '24px', height: '24px', flexShrink: 0, accentColor: '#0A1628' }} />
    <span><strong style={{ display: 'block', fontSize: '14px' }}>{title}</strong><span style={{ fontSize: '12px', lineHeight: 1.5 }}>{sub}</span></span>
  </label>
}

export default function WaiverGate({ userId, onAccepted }) {
  const { lang } = useLang()
  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(false)
  const [check3, setCheck3] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const allChecked = check1 && check2 && check3

  const handleAccept = async () => {
    if (!allChecked || saving) return
    setSaving(true)
    setError('')
    try {
      await saveWaiver(supabase, userId)
      onAccepted()
    } catch {
      setError(lang === 'es' ? 'No se pudo guardar tu aceptación. Intenta de nuevo.' : 'Your acceptance could not be saved. Please try again.')
    } finally { setSaving(false) }
  }

  const es = lang === 'es'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: '#FAF7F2', borderRadius: '20px', padding: '40px 36px',
        maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px' }}>
            {es ? 'Acuerdo requerido' : 'Agreement Required'}
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#0A1628', margin: '0 0 10px' }}>
            {es ? 'Exención de Responsabilidad' : 'Liability Waiver'}
          </h2>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#2A2A2A', opacity: 0.55, margin: 0, lineHeight: 1.6 }}>
            {es
              ? 'Antes de acceder a tu portal, por favor confirma los siguientes puntos.'
              : 'Before accessing your portal, please confirm the following points.'}
          </p>
          <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginTop: '14px' }} />
        </div>

        {/* Checkboxes */}
        <CheckBox
          checked={check1}
          onToggle={() => setCheck1(!check1)}
          title={es ? 'Propósito educativo e investigativo' : 'Educational & Research Purpose'}
          sub={es
            ? 'Entiendo que el contenido de este portal es de naturaleza educativa e informativa, supervisado por un médico certificado, y no sustituye el diagnóstico médico independiente.'
            : 'I understand that the content of this portal is educational and informational in nature, supervised by a licensed physician, and does not substitute independent medical diagnosis.'}
        />
        <CheckBox
          checked={check2}
          onToggle={() => setCheck2(!check2)}
          title={es ? 'Exención de responsabilidad' : 'Liability Waiver'}
          sub={es
            ? 'Acepto que PeptBiohacking y el Dr. Fernando Valenzuela no son responsables de decisiones médicas tomadas fuera del protocolo acordado. Sigo el programa de forma voluntaria.'
            : 'I agree that PeptBiohacking and Dr. Fernando Valenzuela are not liable for medical decisions made outside the agreed protocol. I am participating voluntarily.'}
        />
        <CheckBox
          checked={check3}
          onToggle={() => setCheck3(!check3)}
          title={es ? 'Consentimiento informado' : 'Informed Consent'}
          sub={es
            ? 'Confirmo que tengo 18 años o más y que he discutido mi protocolo con el médico. Entiendo los posibles riesgos y beneficios de la terapia con péptidos.'
            : 'I confirm that I am 18 years or older and have discussed my protocol with the physician. I understand the potential risks and benefits of peptide therapy.'}
        />

        {/* Button */}
        {error && <p role="alert" style={{ color: '#A12B2B' }}>{error}</p>}
        <button
          onClick={handleAccept}
          disabled={!allChecked || saving}
          style={{
            width: '100%', padding: '15px', marginTop: '8px',
            background: allChecked ? '#0A1628' : '#E5E5E5',
            border: 'none', borderRadius: '12px',
            color: allChecked ? '#fff' : '#2A2A2A',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px',
            cursor: allChecked ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {saving ? (
            <>
              <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              {es ? 'Guardando...' : 'Saving...'}
            </>
          ) : (
            es ? 'Acepto y accedo a mi portal' : 'I agree — enter my portal'
          )}
        </button>

        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#2A2A2A', opacity: 0.35 }}>
          {es ? 'Solo se te pedirá una vez.' : 'You will only be asked once.'}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
