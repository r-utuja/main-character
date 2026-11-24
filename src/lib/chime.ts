/** Short soft two-note chime via Web Audio. Silently does nothing if audio isn't available or allowed. */
export function playChime() {
  try {
    const Ctx = window.AudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 1)
    })
    setTimeout(() => void ctx.close(), 2000)
  } catch {
    /* no sound is fine */
  }
}
