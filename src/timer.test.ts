import { describe, expect, it } from 'vitest'
import { completedWorkAfterPhase, defaultSettings, durationForPhase, nextPhase, validateSettings } from './timer'

describe('PomoTomo timer rules', () => {
  it('uses configured durations for each phase', () => {
    expect(durationForPhase('work', defaultSettings)).toBe(1500)
    expect(durationForPhase('shortBreak', defaultSettings)).toBe(300)
    expect(durationForPhase('longBreak', defaultSettings)).toBe(900)
  })

  it('selects a long break after the configured interval count', () => {
    expect(nextPhase('work', 1, defaultSettings)).toBe('shortBreak')
    expect(nextPhase('work', 3, defaultSettings)).toBe('shortBreak')
    expect(nextPhase('work', 4, defaultSettings)).toBe('longBreak')
    expect(nextPhase('longBreak', 0, defaultSettings)).toBe('work')
  })

  it('rejects a long break outside the 15 to 30 minute range', () => {
    expect(validateSettings({ ...defaultSettings, longBreakMinutes: 14 })).toBe(false)
    expect(validateSettings({ ...defaultSettings, longBreakMinutes: 30 })).toBe(true)
    expect(validateSettings({ ...defaultSettings, workMinutes: 0 })).toBe(false)
  })

  it('keeps the work count during short breaks and resets only after a long break', () => {
    expect(completedWorkAfterPhase('work', 0, defaultSettings)).toBe(1)
    expect(completedWorkAfterPhase('work', 3, defaultSettings)).toBe(4)
    expect(completedWorkAfterPhase('shortBreak', 2, defaultSettings)).toBe(2)
    expect(completedWorkAfterPhase('longBreak', 4, defaultSettings)).toBe(0)
  })
})
