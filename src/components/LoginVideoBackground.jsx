import { useEffect, useRef, useState } from 'react'

export default function LoginVideoBackground({ lang }) {
  const video = useRef(null)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = event => setPaused(event.matches)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [])
  useEffect(() => {
    if (!video.current) return
    if (paused) video.current.pause()
    else video.current.play().catch(() => setPaused(true))
  }, [paused])
  return <>
    <div className="portal-login-video-backdrop" aria-hidden="true">
      <video ref={video} muted loop playsInline preload="metadata" poster="/media/dr-v-patient-poster.jpg">
        <source src="/media/dr-v-patient.mp4" type="video/mp4" />
      </video>
      <div className="portal-login-video-shade" />
    </div>
    <button type="button" className="portal-login-video-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {lang === 'es' ? (paused ? 'Reproducir video ▶' : 'Pausar video Ⅱ') : (paused ? 'Play video ▶' : 'Pause video Ⅱ')}
    </button>
  </>
}
