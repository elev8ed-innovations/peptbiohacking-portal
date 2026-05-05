import { useState } from 'react'

const PEPTIDES = [
  { id: 'bpc157', name: 'BPC-157', category: 'Recuperación', unit: 'mcg' },
  { id: 'tb500', name: 'TB-500', category: 'Recuperación', unit: 'mg' },
  { id: 'ghk_cu', name: 'GHK-Cu', category: 'Anti-aging', unit: 'mg' },
  { id: 'ipamorelin', name: 'Ipamorelin', category: 'GH', unit: 'mcg' },
  { id: 'cjc1295', name: 'CJC-1295', category: 'GH', unit: 'mcg' },
  { id: 'epithalon', name: 'Epithalon', category: 'Longevidad', unit: 'mg' },
  { id: 'selank', name: 'Selank', category: 'Nootrópico', unit: 'mcg' },
  { id: 'semax', name: 'Semax', category: 'Nootrópico', unit: 'mcg' },
  { id: 'pt141', name: 'PT-141', category: 'Sexual', unit: 'mg' },
  { id: 'semaglutide', name: 'Semaglutide', category: 'Metabólico', unit: 'mg' },
]

export default function ProtocolBuilder({ value, onChange }) {
  const [search, setSearch] = useState('')

  const filtered = PEPTIDES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  function addPeptide(peptide) {
    if (value.find(p => p.id === peptide.id)) return
    onChange([...value, { ...peptide, dose: '', frequency: 'diario', duration: '4 semanas', notes: '' }])
  }

  function updatePeptide(id, field, val) {
    onChange(value.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  function removePeptide(id) {
    onChange(value.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <input
        placeholder="Buscar péptido..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field"
      />
      <div className="flex flex-wrap gap-2">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => addPeptide(p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              value.find(v => v.id === p.id)
                ? 'bg-teal text-navy border-teal'
                : 'border-white/20 text-white/60 hover:border-teal hover:text-teal'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {value.length > 0 && (
        <div className="space-y-3 mt-4">
          {value.map(p => (
            <div key={p.id} className="card border-teal/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal">{p.name}</span>
                <button onClick={() => removePeptide(p.id)} className="text-white/30 hover:text-red-400 text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-white/40">Dosis ({p.unit})</label>
                  <input value={p.dose} onChange={e => updatePeptide(p.id, 'dose', e.target.value)} className="input-field text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-white/40">Frecuencia</label>
                  <select value={p.frequency} onChange={e => updatePeptide(p.id, 'frequency', e.target.value)} className="input-field text-sm mt-1">
                    <option>diario</option>
                    <option>2x/semana</option>
                    <option>3x/semana</option>
                    <option>semanal</option>
                    <option>ciclo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40">Duración</label>
                  <input value={p.duration} onChange={e => updatePeptide(p.id, 'duration', e.target.value)} className="input-field text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-white/40">Notas</label>
                  <input value={p.notes} onChange={e => updatePeptide(p.id, 'notes', e.target.value)} className="input-field text-sm mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
