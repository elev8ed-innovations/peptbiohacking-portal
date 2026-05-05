import { useState } from 'react'

export default function AgeGateModal({ onConfirm }) {
  const [agreed, setAgreed] = useState(false)
  const [lang, setLang] = useState('es')

  const t = {
    es: {
      title: 'Acceso Restringido',
      subtitle: 'Este portal contiene información médica especializada.',
      age: 'Confirmo que tengo 18 años o más',
      waiver: 'He leído y acepto los términos médicos. Entiendo que los péptidos son compuestos para uso médico bajo supervisión del Dr. Fernando Valenzuela Carpio (COFEPRIS #4667632). Este portal no reemplaza consulta médica presencial.',
      cta: 'Entrar al Portal',
      lang: 'EN',
    },
    en: {
      title: 'Restricted Access',
      subtitle: 'This portal contains specialized medical information.',
      age: 'I confirm I am 18 years of age or older',
      waiver: 'I have read and agree to the medical terms. I understand that peptides are compounds for medical use under the supervision of Dr. Fernando Valenzuela Carpio (COFEPRIS #4667632). This portal does not replace in-person medical consultation.',
      cta: 'Enter Portal',
      lang: 'ES',
    },
  }[lang]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,194,168,0.08)_0%,transparent_70%)]" />
      <div className="relative max-w-md w-full mx-4 card border-teal/30">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-gold">PeptBiohacking</h1>
          <p className="text-white/50 text-sm mt-1">Dr. Fernando Valenzuela Carpio</p>
        </div>

        <div className="w-10 h-px bg-teal/40 mx-auto mb-6" />

        <h2 className="font-display text-xl text-white text-center mb-2">{t.title}</h2>
        <p className="text-white/60 text-sm text-center mb-6">{t.subtitle}</p>

        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-1 accent-teal"
          />
          <span className="text-sm text-white/80">{t.age}</span>
        </label>

        <p className="text-xs text-white/40 mb-6 leading-relaxed border border-white/10 rounded-lg p-3 bg-white/5">
          {t.waiver}
        </p>

        <button
          disabled={!agreed}
          onClick={onConfirm}
          className="w-full btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {t.cta}
        </button>

        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="w-full text-center text-xs text-white/30 hover:text-white/60 mt-4 transition-colors"
        >
          {t.lang}
        </button>
      </div>
    </div>
  )
}
