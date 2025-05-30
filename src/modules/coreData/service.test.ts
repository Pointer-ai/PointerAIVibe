import { describe, it, expect, beforeEach } from 'vitest'
import { createProfile, setCurrentProfile } from '../../utils/profile'
import { addCoreEvent, getCoreData, clearCoreData, getEventsByType } from './service'

describe('coreData service', () => {
  beforeEach(() => {
    localStorage.clear()
    const profile = createProfile('tester')
    setCurrentProfile(profile.id)
  })

  it('should add and retrieve events', () => {
    addCoreEvent({ type: 'learning', details: { lesson: 'intro' } })
    const data = getCoreData()
    expect(data.events.length).toBe(1)
    expect(data.events[0].type).toBe('learning')
  })

  it('should filter events by type', () => {
    addCoreEvent({ type: 'learning', details: {} })
    addCoreEvent({ type: 'assessment', details: {} })
    const learning = getEventsByType('learning')
    expect(learning.length).toBe(1)
  })

  it('should clear data', () => {
    addCoreEvent({ type: 'learning', details: {} })
    clearCoreData()
    expect(getCoreData().events.length).toBe(0)
  })
})
