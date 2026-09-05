export type TimerPhase = 'work' | 'shortBreak' | 'longBreak'
export type TransitionMode = 'automatic' | 'manual'

export type TimerSettings = {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  intervalCount: number
  transitionMode: TransitionMode
}

export const defaultSettings: TimerSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  intervalCount: 4,
  transitionMode: 'automatic',
}

export function durationForPhase(phase: TimerPhase, settings: TimerSettings) {
  if (phase === 'work') return settings.workMinutes * 60
  if (phase === 'shortBreak') return settings.shortBreakMinutes * 60
  return settings.longBreakMinutes * 60
}

export function nextPhase(phase: TimerPhase, completedWork: number, settings: TimerSettings): TimerPhase {
  if (phase === 'work') return completedWork >= settings.intervalCount ? 'longBreak' : 'shortBreak'
  return 'work'
}

export function completedWorkAfterPhase(phase: TimerPhase, completedWork: number, settings: TimerSettings) {
  if (phase === 'work') return Math.min(completedWork + 1, settings.intervalCount)
  if (phase === 'shortBreak') return completedWork
  return 0
}

export function phaseLabel(phase: TimerPhase) {
  return phase === 'work' ? 'Focus session' : phase === 'shortBreak' ? 'Short break' : 'Long break'
}

export function validateSettings(settings: TimerSettings) {
  return settings.workMinutes >= 1 && settings.workMinutes <= 120 &&
    settings.shortBreakMinutes >= 1 && settings.shortBreakMinutes <= 60 &&
    settings.longBreakMinutes >= 15 && settings.longBreakMinutes <= 30 &&
    settings.intervalCount >= 1 && settings.intervalCount <= 12
}
