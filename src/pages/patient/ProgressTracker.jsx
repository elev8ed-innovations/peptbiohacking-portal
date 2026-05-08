import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

const inp = {
  width: '100%', padding: '13px 16px',
  background: '#fff', border: '1px solid #E5E5E5',
  borderRadius: '10px', color: '#2A2A2A',
  fontFamily: 'Outfit, sans-serif', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', minHeight: '44px',
}

export default function ProgressTracker() {
  const { t } = useLang()
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ weight: '', energy: 5, sleep: 5, mood: 5, notes: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('wellness_checkins')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setEntries(data || [])
    }
    load()
  }, [])

  const save = async () => {
    if (!userId) return
    setSaving(true)
    await supabase.from('wellness_checkins').insert({
      patient_id: userId,
      wellness_score: form.mood,
      notes: form.notes,
      weight: form.weight || null,
      energy_level: form.energy,
      sleep_quality: form.sleep,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
    setForm({ weight: '', energy: 5, sleep: 5, mood: 5, notes: '' })
    const { data } = await supabase.from('wellness_checkins').select('*').eq('patient_id', userId).order('created_at', { ascending: false }).limit(10)
    setEntries(data || [])
  }

  const SliderField = ({ label, key_, value }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <label style={{ color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{label}</label>
        <span style={{ color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px' }}>{value}<span style={{ opacity: 0.4 }}>/10</span></span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => setForm(f => ({ ...f, [key_]: Number(e.target.value) }))}
        style={{ width: '100%', accentColor: '#0A1628', height: '6px', minHeight: '44px', cursor: 'pointer' }}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>Patient</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.progressTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '32px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Log Form */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', margin: 0 }}>
              {t.checkin} Today
            </h3>
            <input
              type="number" placeholder={t.weight}
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              style={inp}
            />
            <SliderField label={t.energy} key_="energy" value={form.energy} />
            <SliderField label={t.sleep} key_="sleep" value={form.sleep} />
            <SliderField label={t.mood} key_="mood" value={form.mood} />
            <textarea
              placeholder={t.notes}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
            />
            <button
              onClick={save} disabled={saving}
              style={{
                padding: '14px', minHeight: '44px',
                background: saved ? '#00C2A8' : '#0A1628',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >{saved ? `✓ ${t.saved}` : t.save}</button>
          </div>

          {/* History */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflowY: 'auto', maxHeight: '560px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', margin: '0 0 16px' }}>
              History
            </h3>
            {entries.length === 0 ? (
              <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{t.noCheckins}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #F5F5F5', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#2A2A2A', opacity: 0.45, fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                        {new Date(e.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ color: '#0A1628', fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        {e.wellness_score}/10
                      </span>
                    </div>
                    {e.weight && <p style={{ color: '#2A2A2A', opacity: 0.6, fontSize: '12px', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px' }}>Weight: {e.weight} kg</p>}
                    {e.notes && <p style={{ color: '#2A2A2A', opacity: 0.7, fontSize: '13px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{e.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
