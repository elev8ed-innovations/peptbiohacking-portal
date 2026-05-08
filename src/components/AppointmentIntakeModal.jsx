import { useLang } from '../context/LanguageContext'

export default function AppointmentIntakeModal({ appointment, onClose }) {
  const { lang } = useLang()
  if (!appointment) return null

  const intake = appointment.intake_data || {}
  const dt = new Date(appointment.appointment_datetime)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
              {lang === 'es' ? 'Intake del Paciente' : 'Patient Intake'}
            </p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#0A1628', margin: 0 }}>
              {appointment.patient_name}
            </h2>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#2A2A2A', opacity: 0.5, marginTop: '2px' }}>
              {dt.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#2A2A2A', opacity: 0.35, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ width: '100%', height: '1px', background: '#E5E5E5', marginBottom: '24px' }} />

        {/* Intake fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'Outfit, sans-serif' }}>
          <IntakeRow label={lang === 'es' ? 'Correo' : 'Email'} value={appointment.patient_email} />
          <IntakeRow label="WhatsApp" value={appointment.patient_whatsapp} />
          {Object.entries(intake).map(([question, answer]) => (
            <IntakeRow key={question} label={question} value={answer} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          {appointment.meeting_link && (
            <a
              href={appointment.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '12px', background: '#00C2A8', border: 'none',
                borderRadius: '10px', color: '#fff', fontFamily: 'Outfit, sans-serif',
                fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                textDecoration: 'none', minHeight: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {lang === 'es' ? 'Unirse a Meet' : 'Join Meet'}
            </a>
          )}
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', background: '#fff', border: '1px solid #E5E5E5',
            borderRadius: '10px', color: '#2A2A2A', fontFamily: 'Outfit, sans-serif',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer', minHeight: '44px',
          }}>
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IntakeRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.45, marginBottom: '3px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#0A1628', margin: 0 }}>{value}</p>
    </div>
  )
}
