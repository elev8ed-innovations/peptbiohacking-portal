import { useState } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

export default function WellnessCheckin() {
  const { t } = useLang()
  const [score, setScore] = useState(7)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('wellness_checkins').insert({
      patient_id: user.id,
      wellness_score: score,
      notes,
    })
    setSaved(true)
    setNotes('')
    setTimeout(() => setSaved(false), 2500)
    setSaving(false)
  }

  const emojis = ['😔', '😟', '😐', '🙂', '😊', '😄', '🤩']
  const emojiIndex = Math.min(Math.floor((score - 1) / 1.5), emojis.length - 1)
  const scoreColor = score <= 3 ? '#dc2626' : score <= 6 ? '#C9A84C' : '#00C2A8'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>Daily</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.checkin}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '32px' }} />

        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '20px', padding: '36px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Score display */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '12px', lineHeight: 1 }}>{emojis[emojiIndex]}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '56px', color: scoreColor, fontWeight: 700, lineHeight: 1 }}>{score}</div>
            <div style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', marginBottom: '20px' }}>/ 10</div>
            <input
              type="range" min="1" max="10" value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: scoreColor, height: '8px', minHeight: '44px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#2A2A2A', opacity: 0.35, marginTop: '6px' }}>
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', color: '#2A2A2A', opacity: 0.6, fontFamily: 'Outfit, sans-serif', fontSize: '14px', marginBottom: '8px' }}>
              {t.notes}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder={t.messagePlaceholder}
              style={{
                width: '100%', padding: '13px 16px',
                background: '#FAF7F2', border: '1px solid #E5E5E5',
                borderRadius: '10px', color: '#2A2A2A',
                fontFamily: 'Outfit, sans-serif', fontSize: '14px',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                minHeight: '100px',
              }}
            />
          </div>

          <button
            onClick={save} disabled={saving}
            style={{
              padding: '15px', minHeight: '48px',
              background: saved ? '#00C2A8' : '#0A1628',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >{saved ? `✓ ${t.saved}` : t.save}</button>
        </div>
      </div>
    </div>
  )
}
