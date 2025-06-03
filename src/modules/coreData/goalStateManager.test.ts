import { GoalActivationManager, getActivationStats, activateGoal, pauseGoal } from './goalActivationManager'
import { getLearningGoals, createLearningGoal, updateLearningGoal } from './service'
import { LearningGoal } from './types'
import { log } from '../../utils/logger'

export interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

export interface TestSuiteResult {
  success: boolean
  summary: string
  results: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
}

/**
 * 目标状态管理测试套件
 */
export class GoalStateManagerTest {
  private static goalActivationManager = new GoalActivationManager()
  
  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<TestSuiteResult> {
    const results: TestResult[] = []
    const startTime = Date.now()
    
    log('[GoalStateManagerTest] Starting test suite...')
    
    try {
      // 测试1: 目标激活限制
      results.push(await this.testActivationLimit())
      
      // 测试2: 目标状态转换
      results.push(await this.testStatusTransitions())
      
      // 测试3: 状态统计功能
      results.push(await this.testActivationStats())
      
      // 测试4: 批量操作
      results.push(await this.testBatchOperations())
      
      // 测试5: 边界条件
      results.push(await this.testEdgeCases())
      
      // 测试6: 数据一致性
      results.push(await this.testDataConsistency())
      
    } catch (error) {
      log('[GoalStateManagerTest] Test suite error:', error)
      results.push({
        name: 'Test Suite Execution',
        passed: false,
        message: `Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
    
    const passedTests = results.filter(r => r.passed).length
    const failedTests = results.length - passedTests
    const totalDuration = Date.now() - startTime
    
    const summary = `${passedTests}/${results.length} tests passed in ${totalDuration}ms`
    
    log(`[GoalStateManagerTest] Test suite completed: ${summary}`)
    
    return {
      success: failedTests === 0,
      summary,
      results,
      totalTests: results.length,
      passedTests,
      failedTests
    }
  }
  
  /**
   * 测试激活限制功能
   */
  private static async testActivationLimit(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const stats = getActivationStats()
      const initialActiveCount = stats.active
      
      // 创建测试目标
      const testGoalIds = await this.createTestGoals(5)
      
      // 尝试激活超过限制的目标数量
      let successfulActivations = 0
      let failedActivations = 0
      
      for (const goalId of testGoalIds) {
        const result = await activateGoal(goalId)
        if (result.success) {
          successfulActivations++
        } else {
          failedActivations++
        }
      }
      
      const finalStats = getActivationStats()
      const activatedCount = finalStats.active - initialActiveCount
      
      // 验证激活限制是否正确工作
      const maxAllowed = this.goalActivationManager.getConfig().maxActiveGoals
      const expectedActivated = Math.min(testGoalIds.length, maxAllowed - initialActiveCount)
      
      const passed = activatedCount <= maxAllowed && activatedCount === expectedActivated
      
      // 清理测试数据
      await this.cleanupTestGoals(testGoalIds)
      
      return {
        name: 'Activation Limit Test',
        passed,
        message: passed 
          ? `✅ Activation limit working correctly (${activatedCount}/${maxAllowed} slots used)`
          : `❌ Activation limit failed (expected max ${maxAllowed}, got ${activatedCount})`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Activation Limit Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 测试状态转换功能
   */
  private static async testStatusTransitions(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // 创建一个测试目标
      const testGoalIds = await this.createTestGoals(1)
      const goalId = testGoalIds[0]
      
      // 测试状态转换序列: paused -> active -> paused -> completed
      const transitions = [
        { to: 'active', method: () => activateGoal(goalId) },
        { to: 'paused', method: () => pauseGoal(goalId, 'test pause') }
      ]
      
      let allTransitionsPassed = true
      const transitionResults: string[] = []
      
      for (const transition of transitions) {
        const result = await transition.method()
        const success = result.success && result.newStatus === transition.to
        
        if (success) {
          transitionResults.push(`✅ ${result.oldStatus} -> ${transition.to}`)
        } else {
          transitionResults.push(`❌ Failed: ${result.oldStatus} -> ${transition.to} (${result.message})`)
          allTransitionsPassed = false
        }
      }
      
      // 清理测试数据
      await this.cleanupTestGoals(testGoalIds)
      
      return {
        name: 'Status Transitions Test',
        passed: allTransitionsPassed,
        message: allTransitionsPassed 
          ? `✅ All status transitions working: ${transitionResults.join(', ')}`
          : `❌ Some transitions failed: ${transitionResults.join(', ')}`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Status Transitions Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 测试统计功能
   */
  private static async testActivationStats(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const initialStats = getActivationStats()
      
      // 创建测试目标并激活一些
      const testGoalIds = await this.createTestGoals(2)
      await activateGoal(testGoalIds[0])
      
      const finalStats = getActivationStats()
      
      // 验证统计数据
      const statsValid = 
        finalStats.total >= initialStats.total &&
        finalStats.active >= initialStats.active &&
        finalStats.availableSlots >= 0 &&
        finalStats.utilizationRate >= 0 &&
        finalStats.utilizationRate <= 1
      
      // 清理测试数据
      await this.cleanupTestGoals(testGoalIds)
      
      return {
        name: 'Activation Stats Test',
        passed: statsValid,
        message: statsValid 
          ? `✅ Stats calculation working (${finalStats.active}/${finalStats.maxActive} active)`
          : `❌ Stats calculation failed`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Activation Stats Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 测试批量操作
   */
  private static async testBatchOperations(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // 创建多个测试目标
      const testGoalIds = await this.createTestGoals(3)
      
      // 测试批量激活
      const batchResult = await this.goalActivationManager.activateMultipleGoals(testGoalIds)
      
      const passed = batchResult.successCount > 0 && 
                    batchResult.successCount + batchResult.failureCount === testGoalIds.length
      
      // 清理测试数据
      await this.cleanupTestGoals(testGoalIds)
      
      return {
        name: 'Batch Operations Test',
        passed,
        message: passed 
          ? `✅ Batch activation working (${batchResult.successCount}/${testGoalIds.length} successful)`
          : `❌ Batch activation failed`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Batch Operations Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 测试边界条件
   */
  private static async testEdgeCases(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // 测试不存在的目标
      const nonExistentResult = await activateGoal('non-existent-goal-id')
      const nonExistentHandled = !nonExistentResult.success
      
      // 测试重复激活
      const testGoalIds = await this.createTestGoals(1)
      const goalId = testGoalIds[0]
      
      await activateGoal(goalId) // 第一次激活
      const duplicateResult = await activateGoal(goalId) // 重复激活
      const duplicateHandled = duplicateResult.success && duplicateResult.message.includes('已经是激活状态')
      
      // 清理测试数据
      await this.cleanupTestGoals(testGoalIds)
      
      const passed = nonExistentHandled && duplicateHandled
      
      return {
        name: 'Edge Cases Test',
        passed,
        message: passed 
          ? `✅ Edge cases handled correctly`
          : `❌ Some edge cases not handled properly`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Edge Cases Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 测试数据一致性
   */
  private static async testDataConsistency(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const initialGoals = getLearningGoals()
      const initialStats = getActivationStats()
      
      // 验证统计数据与实际数据一致
      const actualActive = initialGoals.filter(g => g.status === 'active').length
      const actualTotal = initialGoals.length
      const actualPaused = initialGoals.filter(g => g.status === 'paused').length
      const actualCompleted = initialGoals.filter(g => g.status === 'completed').length
      
      const statsConsistent = 
        initialStats.active === actualActive &&
        initialStats.total === actualTotal &&
        initialStats.paused === actualPaused &&
        initialStats.completed === actualCompleted
      
      return {
        name: 'Data Consistency Test',
        passed: statsConsistent,
        message: statsConsistent 
          ? `✅ Data consistency verified (${actualActive} active, ${actualTotal} total)`
          : `❌ Data inconsistency detected`,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      return {
        name: 'Data Consistency Test',
        passed: false,
        message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * 创建测试目标
   */
  private static async createTestGoals(count: number): Promise<string[]> {
    const goalIds: string[] = []
    
    for (let i = 0; i < count; i++) {
      const goalId = `test-goal-${Date.now()}-${i}`
      const goal: Omit<LearningGoal, 'id'> = {
        title: `Test Goal ${i + 1}`,
        description: `Test goal for unit testing purposes ${i + 1}`,
        category: 'custom',
        priority: 1,
        status: 'paused',
        targetLevel: 'beginner',
        estimatedTimeWeeks: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requiredSkills: [],
        outcomes: []
      }
      
      const created = createLearningGoal(goal)
      if (created) {
        goalIds.push(created.id)
      }
    }
    
    return goalIds
  }
  
  /**
   * 清理测试目标
   */
  private static async cleanupTestGoals(goalIds: string[]): Promise<void> {
    for (const goalId of goalIds) {
      try {
        // 将目标状态设置为取消，模拟删除
        updateLearningGoal(goalId, { 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
      } catch (error) {
        log(`[GoalStateManagerTest] Failed to cleanup goal ${goalId}:`, error)
      }
    }
  }
} 