import { useEffect, useMemo, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { Minus, Pin, RotateCcw, Settings, X } from 'lucide-react'
import { completedWorkAfterPhase, defaultSettings, durationForPhase, nextPhase, phaseLabel, type TimerPhase, type TimerSettings, validateSettings } from './timer'
import './App.css'

const appWindow = getCurrentWindow()

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

function App() {
  const [settings, setSettings] = useState(defaultSettings)
  const [phase, setPhase] = useState<TimerPhase>('work')
  const [remaining, setRemaining] = useState(durationForPhase('work', defaultSettings))
  const [running, setRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [completedWork, setCompletedWork] = useState(0)
  const [pinned, setPinned] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState(defaultSettings)
  const [settingsError, setSettingsError] = useState('')
  const endAt = useRef<number | null>(null)
  const remainingRef = useRef(remaining)
  const totalSeconds = durationForPhase(phase, settings)
  const progress = Math.max(0, Math.min(1, 1 - remaining / totalSeconds))
  const isGrey = phase !== 'work' || (hasStarted && !running)

  useEffect(() => { remainingRef.current = remaining }, [remaining])
  useEffect(() => {
    invoke<TimerSettings | null>('load_settings').then((saved) => {
      if (saved) { setSettings(saved); setDraft(saved); setRemaining(durationForPhase('work', saved)) }
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    if (!running) return
    if (endAt.current === null) endAt.current = Date.now() + remainingRef.current * 1000
    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((endAt.current! - Date.now()) / 1000))
      setRemaining(nextRemaining)
      if (nextRemaining === 0) {
        const nextCompleted = completedWorkAfterPhase(phase, completedWork, settings)
        const following = nextPhase(phase, nextCompleted, settings)
        setCompletedWork(nextCompleted)
        setPhase(following); setRemaining(durationForPhase(following, settings)); endAt.current = null
        notify(`${phaseLabel(following)}`)
        if (settings.transitionMode === 'manual') setRunning(false)
      }
    }
    tick(); const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [running, phase, completedWork, settings])

  const cycleText = useMemo(() => `${completedWork} / ${settings.intervalCount} pomodoros`, [completedWork, settings.intervalCount])
  async function notify(body: string) {
    let permission = await isPermissionGranted()
    if (!permission) permission = (await requestPermission()) === 'granted'
    if (permission) sendNotification({ title: 'PomoTomo', body })
  }
  async function togglePin() {
    const next = !pinned
    try {
      await appWindow.setAlwaysOnTop(next)
      setPinned(next)
    } catch (error) {
      console.error('Unable to change always-on-top state', error)
    }
  }
  function resetTimer() { setRunning(false); endAt.current = null; setRemaining(durationForPhase(phase, settings)) }
  function saveSettings() {
    if (!validateSettings(draft)) { setSettingsError('Use valid durations. Long break must be 15 to 30 minutes.'); return }
    setSettings(draft); setRemaining(durationForPhase(phase, draft)); setRunning(false); endAt.current = null
    invoke('save_settings', { settings: draft }).catch(() => undefined); setSettingsError(''); setShowSettings(false)
  }

  function dragWindow(event: React.MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    appWindow.startDragging().catch((error) => console.error('Unable to drag window', error))
  }

  return <main className={`app-shell ${isGrey ? 'is-paused' : ''}`} style={{ '--progress-background': `linear-gradient(${132 + progress * 95}deg, hsl(${progress * 112}, 77%, 55%) 0%, hsl(${Math.min(112, progress * 170)}, 76%, 65%) 100%)` } as React.CSSProperties}>
    <header className="window-bar" onMouseDown={dragWindow}><span className="brand window-drag-region">Pomo<span>Tomo</span></span><div className="window-actions">
      <div className="compact-actions"><button className="icon-button" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={14} /></button><button className="icon-button" onClick={() => { setDraft(settings); setShowSettings(true) }} aria-label="Open settings"><Settings size={14} /></button></div>
      <button className={`icon-button ${pinned ? 'is-active' : ''}`} onClick={togglePin} aria-label="Stay on top"><Pin size={16} /></button><button className="icon-button" onClick={() => appWindow.minimize()} aria-label="Minimize"><Minus size={17} /></button><button className="icon-button close" onClick={() => appWindow.close()} aria-label="Close"><X size={16} /></button>
    </div></header>
    <section className="timer-stage"><div className="eyebrow">{phaseLabel(phase)}</div><button className="minimal-timer" onClick={() => { if (running) endAt.current = null; setHasStarted(true); setRunning((value) => !value) }} aria-label={running ? 'Pause timer' : 'Start timer'}><span className="timer-readout">{formatTime(remaining)}</span><span className="timer-action">{running ? 'Pause' : 'Start'}</span></button><div className="cycle-label">{cycleText}</div><div className="stage-actions"><button className="text-button" onClick={resetTimer}><RotateCcw size={14} /> Reset</button><button className="text-button" onClick={() => { setDraft(settings); setShowSettings(true) }}><Settings size={14} /> Settings</button></div></section>
    {showSettings && <div className="settings-backdrop" onClick={() => setShowSettings(false)}><section className="settings-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Preferences</span><h2>Timer settings</h2></div><button className="icon-button" onClick={() => setShowSettings(false)} aria-label="Close settings"><X size={17} /></button></div>
      {([['workMinutes', 'Focus session', 1, 120], ['shortBreakMinutes', 'Short break', 1, 60], ['longBreakMinutes', 'Long break', 15, 30], ['intervalCount', 'Sessions before long break', 1, 12]] as const).map(([key, label, min, max]) => <label key={key}>{label}<input type="number" min={min} max={max} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} /><span>{key === 'intervalCount' ? '' : 'min'}</span></label>)}
      <label className="check-row"><span>Start next phase automatically</span><input type="checkbox" checked={draft.transitionMode === 'automatic'} onChange={(event) => setDraft({ ...draft, transitionMode: event.target.checked ? 'automatic' : 'manual' })} /></label>{settingsError && <p className="error-text">{settingsError}</p>}<button className="save-button" onClick={saveSettings}>Save changes</button>
    </section></div>}
  </main>
}

export default App