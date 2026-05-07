import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

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
    // Refresh
    const { data } = await supabase.from('wellness_checkins').select('*').eq('patient_id', userId).order('created_at', { ascending: false }).limit(10)
    setEntries(data || [])
  }

  const SliderField = ({ label, key_, value }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{label}</label>
        <span style={{ color: '#00C2A8', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{value}/10</span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => setForm(f => ({ ...f, [key_]: Number(e.target.value) }))}
        style={{ width: '100%', accentColor: '#00C2A8' }}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#fff', margin: '0 0 8px' }}>
          {t.progressTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '28px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Log Form */}
          <div style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C9A84C', margin: 0 }}>
              Log Today
            </h3>
            <input
              type="number" placeholder={t.weight}
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none' }}
            />
            <SliderField label={t.energy} key_="energy" value={form.energy} />
            <SliderField label={t.sleep} key_="sleep" value={form.sleep} />
            <SliderField label={t.mood} key_="mood" value={form.mood} />
            <textarea
              placeholder={t.notes}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.2)', borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            />
            <button
              onClick={save} disabled={saving}
              style={{
                padding: '12px', background: saved ? 'rgba(0,194,168,0.3)' : 'linear-gradient(135deg, #00C2A8, #00A891)',
                border: 'none', borderRadius: '8px', color: '#0A1628',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}
            >{saved ? t.saved : t.save}</button>
          </div>

          {/* History */}
          <div style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: '12px', padding: '24px', overflowY: 'auto', maxHeight: '500px' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C9A84C', margin: '0 0 16px' }}>
              History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {entries.map((e, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ color: '#00C2A8', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      {e.wellness_score}/10
                    </span>
                  </div>
                  {e.notes && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{e.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
