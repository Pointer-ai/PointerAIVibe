import { describe, it, expect } from 'vitest'
import { getScoreLevel, ScoreLevel, DEFAULT_WEIGHTS } from './types'

describe('abilityAssess/types', () => {
  describe('getScoreLevel', () => {
    it('should return correct level for different scores', () => {
      expect(getScoreLevel(10)).toBe(ScoreLevel.Novice)
      expect(getScoreLevel(20)).toBe(ScoreLevel.Novice)
      expect(getScoreLevel(21)).toBe(ScoreLevel.Beginner)
      expect(getScoreLevel(40)).toBe(ScoreLevel.Beginner)
      expect(getScoreLevel(41)).toBe(ScoreLevel.Intermediate)
      expect(getScoreLevel(60)).toBe(ScoreLevel.Intermediate)
      expect(getScoreLevel(61)).toBe(ScoreLevel.Advanced)
      expect(getScoreLevel(80)).toBe(ScoreLevel.Advanced)
      expect(getScoreLevel(81)).toBe(ScoreLevel.Expert)
      expect(getScoreLevel(100)).toBe(ScoreLevel.Expert)
    })
  })

  describe('DEFAULT_WEIGHTS', () => {
    it('should have weights that sum to 1', () => {
      const sum = Object.values(DEFAULT_WEIGHTS).reduce((acc, weight) => acc + weight, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })

    it('should have all required dimensions', () => {
      expect(DEFAULT_WEIGHTS).toHaveProperty('programming')
      expect(DEFAULT_WEIGHTS).toHaveProperty('algorithm')
      expect(DEFAULT_WEIGHTS).toHaveProperty('project')
      expect(DEFAULT_WEIGHTS).toHaveProperty('systemDesign')
      expect(DEFAULT_WEIGHTS).toHaveProperty('communication')
    })
  })
}) 