import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [patient, setPatient] = useState(null)
  const [tab, setTab] = useState('messages')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [labs, setLabs] = useState([])
  const [consults, setConsults] = useState([])
  const [doctorId, setDoctorId] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setDoctorId(user.id)

      const [{ data: prof }, { data: msgs }, { data: labData }, { data: consultData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('messages').select('*, profiles(full_name, role)').eq('patient_id', id).order('created_at', { ascending: true }),
        supabase.from('lab_uploads').select('*').eq('patient_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('consultations').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
      ])

      setPatient(prof)
      setMessages(msgs || [])
      setLabs(labData || [])
      setConsults(consultData || [])
    }
    load()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      patient_id: id,
      sender_id: doctorId,
      sender_role: 'doctor',
      body: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
    const { data } = await supabase.from('messages').select('*, profiles(full_name, role)').eq('patient_id', id).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const tabStyle = (active) => ({
    padding: '8px 20px', borderRadius: '8px',
    background: active ? 'rgba(0,194,168,0.15)' : 'transparent',
    border: active ? '1px solid rgba(0,194,168,0.4)' : '1px solid transparent',
    color: active ? '#00C2A8' : 'rgba(255,255,255,0.5)',
    fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="doctor" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button onClick={() => navigate('/doctor/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C2A8, #C9A84C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', fontWeight: 700,
          }}>{patient?.full_name?.[0] || 'P'}</div>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#fff', margin: 0 }}>
              {patient?.full_name || 'Patient'}
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>{patient?.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['messages', 'labs', 'consultations'].map(tab_ => (
            <button key={tab_} onClick={() => setTab(tab_)} style={tabStyle(tab === tab_)}>
              {tab_ === 'messages' ? t.messages : tab_ === 'labs' ? t.labs : t.consultations}
            </button>
          ))}
        </div>

        {/* Messages Tab */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)',
              borderRadius: '12px', padding: '20px', minHeight: '400px', maxHeight: '500px',
              overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif' }}>{t.noMessages}</p>
                </div>
              ) : messages.map((msg, i) => {
                const isDoctor = msg.sender_role === 'doctor'
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: isDoctor ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: isDoctor ? 'linear-gradient(135deg, #C9A84C, #a88530)' : 'linear-gradient(135deg, #00C2A8, #00A891)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#0A1628',
                    }}>{isDoctor ? 'Dr' : (patient?.full_name?.[0] || 'P')}</div>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px',
                      borderRadius: isDoctor ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isDoctor ? 'rgba(201,168,76,0.12)' : 'rgba(0,194,168,0.1)',
                      border: `1px solid ${isDoctor ? 'rgba(201,168,76,0.25)' : 'rgba(0,194,168,0.25)'}`,
                    }}>
                      <p style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{msg.body}</p>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: isDoctor ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t.messagePlaceholder}
                style={{ flex: 1, padding: '12px 16px', background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none' }}
              />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #C9A84C, #a88530)',
                border: 'none', borderRadius: '8px', color: '#0A1628',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                opacity: sending || !newMessage.trim() ? 0.5 : 1,
              }}>{t.send}</button>
            </div>
          </div>
        )}

        {/* Labs Tab */}
        {tab === 'labs' && (
          <div style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '12px', padding: '24px' }}>
            {labs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif', textAlign: 'center', padding: '40px 0' }}>{t.noLabs}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                {labs.map((file, i) => (
                  <a key={i} href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '8px' }}>
                        {file.file_name?.endsWith('.pdf') ? '📄' : '🖼'}
                      </div>
                      <p style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '12px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{new Date(file.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consultations Tab */}
        {tab === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {consults.length === 0 ? (
              <div style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif' }}>
                No consultations yet
              </div>
            ) : consults.map((c, i) => (
              <div key={i} style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#00C2A8', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                {c.chief_complaint && <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: '0 0 10px' }}>{c.chief_complaint}</p>}
                {c.peptide_protocol?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {c.peptide_protocol.map((p, j) => (
                      <span key={j} style={{ background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.3)', borderRadius: '6px', padding: '4px 10px', color: '#00C2A8', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                        {p.name} {p.dose && `— ${p.dose}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
