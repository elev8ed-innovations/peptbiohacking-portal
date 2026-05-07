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
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name, role)')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoading(false)
    }
    load()

    // Real-time subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    await supabase.from('messages').insert({
      patient_id: userId,
      sender_id: user.id,
      sender_role: profile?.role || 'patient',
      body: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)

    // Refresh
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name, role)')
      .eq('patient_id', userId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', flexDirection: 'column' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#fff', margin: '0 0 8px' }}>
          {t.messagesTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '24px' }} />

        {/* Messages area */}
        <div style={{
          flex: 1, background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)',
          borderRadius: '12px', padding: '20px', overflowY: 'auto',
          minHeight: '400px', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid rgba(0,194,168,0.2)', borderTop: '2px solid #00C2A8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === userId
              const isDoctor = msg.sender_role === 'doctor'
              return (
                <div key={i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: isDoctor ? 'linear-gradient(135deg, #C9A84C, #a88530)' : 'linear-gradient(135deg, #00C2A8, #00A891)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#0A1628',
                  }}>
                    {isDoctor ? 'Dr' : (msg.profiles?.full_name?.[0] || 'P')}
                  </div>
                  <div style={{
                    maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isMe ? 'rgba(0,194,168,0.2)' : 'rgba(201,168,76,0.12)',
                    border: `1px solid ${isMe ? 'rgba(0,194,168,0.3)' : 'rgba(201,168,76,0.25)'}`,
                  }}>
                    {!isMe && (
                      <div style={{ fontSize: '11px', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', fontWeight: 600, marginBottom: '4px' }}>
                        {isDoctor ? 'Dr. Fernando' : msg.profiles?.full_name}
                      </div>
                    )}
                    <p style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{msg.body}</p>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
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
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={t.messagePlaceholder}
            style={{
              flex: 1, padding: '12px 16px',
              background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.2)',
              borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '12px 24px', background: 'linear-gradient(135deg, #00C2A8, #00A891)',
              border: 'none', borderRadius: '8px', color: '#0A1628',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              opacity: sending || !newMessage.trim() ? 0.5 : 1,
            }}
          >{t.send}</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
