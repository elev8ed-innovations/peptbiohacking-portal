import { useState, useEffect } from 'react'
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
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const emojis = ['😔', '😟', '😐', '🙂', '😊', '😄', '🤩']
  const emojiIndex = Math.min(Math.floor((score - 1) / 1.5), emojis.length - 1)

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#fff', margin: '0 0 8px' }}>
          {t.checkin}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '32px' }} />

        <div style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>{emojis[emojiIndex]}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', color: '#00C2A8', fontWeight: 700 }}>{score}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', marginBottom: '16px' }}>/ 10</div>
            <input
              type="range" min="1" max="10" value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00C2A8', height: '6px' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', marginBottom: '8px' }}>
              {t.notes}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder={t.messagePlaceholder}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={save} disabled={saving}
            style={{
              padding: '14px', background: saved ? 'rgba(0,194,168,0.2)' : 'linear-gradient(135deg, #00C2A8, #00A891)',
              border: saved ? '1px solid #00C2A8' : 'none', borderRadius: '10px',
              color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            }}
          >{saved ? `✓ ${t.saved}` : t.save}</button>
        </div>
      </div>
    </div>
  )
}
