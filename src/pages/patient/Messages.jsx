import { useState, useEffect, useRef } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

export default function Messages() {
  const { t } = useLang()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const [doctorId, setDoctorId] = useState(null)
  const bottomRef = useRef(null)

  const fetchMessages = async (uid) => {
    // Fetch full dialogue: all messages where this user is sender OR receiver
    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, role)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Look up the doctor to use as receiver_id when patient sends
      const { data: doctor } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'doctor')
        .limit(1)
        .maybeSingle()
      setDoctorId(doctor?.id ?? null)

      await fetchMessages(user.id)
      setLoading(false)
    }
    load()
  }, [])

  // Realtime: only trigger re-fetch for messages involving this user
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          if (msg.sender_id === userId || msg.receiver_id === userId) {
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !userId) return
    setSending(true)

    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: doctorId,
      sender_role: 'patient',
      body: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
    await fetchMessages(userId)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', flexDirection: 'column' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>Portal</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.messagesTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '24px' }} />

        {/* Messages area */}
        <div style={{
          flex: 1, background: '#fff', border: '1px solid #E5E5E5',
          borderRadius: '16px', padding: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          minHeight: '400px', maxHeight: '520px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid #E5E5E5', borderTop: '2px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === userId
              const isDoctor = msg.sender_role === 'doctor'
              return (
                <div key={msg.id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: isDoctor ? '#C9A84C' : '#0A1628',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff',
                  }}>
                    {isDoctor ? 'Dr' : (msg.profiles?.full_name?.[0] || 'P')}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    maxWidth: '72%', padding: '11px 15px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? '#00C2A8' : '#FAF7F2',
                    border: isMe ? 'none' : '1px solid #E5E5E5',
                  }}>
                    {!isMe && (
                      <div style={{ fontSize: '11px', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '4px' }}>
                        {isDoctor ? 'Dr. Fernando' : (msg.profiles?.full_name || 'Patient')}
                      </div>
                    )}
                    <p style={{ color: isMe ? '#fff' : '#2A2A2A', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                      {msg.body}
                    </p>
                    <div style={{ fontSize: '11px', color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(42,42,42,0.35)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t.messagePlaceholder}
            style={{
              flex: 1, padding: '13px 16px', minHeight: '48px',
              background: '#fff', border: '1px solid #E5E5E5',
              borderRadius: '12px', color: '#2A2A2A',
              fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '13px 24px', minHeight: '48px',
              background: '#0A1628',
              border: 'none', borderRadius: '12px', color: '#fff',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              opacity: sending || !newMessage.trim() ? 0.45 : 1,
              flexShrink: 0,
            }}
          >{t.send}</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
