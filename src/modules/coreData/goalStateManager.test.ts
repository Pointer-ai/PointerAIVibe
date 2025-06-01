// 目标状态管理测试
// 验证最多激活3个目标的限制、状态转换、路径同步等功能

import { 
  createLearningGoal, 
  getLearningGoals, 
  getActiveGoals,
  getGoalStatusStats,
  activateGoal,
  pauseGoal,
  completeGoal,
  cancelGoal,
  createLearningPath,
  getLearningPaths,
  updateLearningGoal
} from './service'
import { agentToolExecutor } from './agentTools'
import { setCurrentProfile } from '../../utils/profile'

/**
 * 目标状态管理测试套件
 */
export class GoalStateManagerTest {
  
  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<{
    success: boolean
    results: Array<{ name: string; passed: boolean; message: string }>
    summary: string
  }> {
    const results: Array<{ name: string; passed: boolean; message: string }> = []
    
    // 设置测试环境
    await this.setupTestEnvironment()
    
    try {
      // 1. 测试3个目标限制
      results.push(await this.testThreeGoalLimit())
      
      // 2. 测试目标状态转换
      results.push(await this.testGoalStatusTransitions())
      
      // 3. 测试路径状态同步
      results.push(await this.testPathStatusSync())
      
      // 4. 测试LLM工具集成
      results.push(await this.testLLMToolIntegration())
      
      // 5. 测试状态统计
      results.push(await this.testStatusStats())
      
      // 6. 测试边界条件
      results.push(await this.testEdgeCases())
      
    } catch (error) {
      results.push({
        name: '测试执行',
        passed: false,
        message: `测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    } finally {
      // 清理测试数据
      await this.cleanupTestData()
    }
    
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    const success = passedCount === totalCount
    
    return {
      success,
      results,
      summary: `${passedCount}/${totalCount} 测试通过 ${success ? '✅' : '❌'}`
    }
  }
  
  /**
   * 测试1: 3个目标限制
   */
  private static async testThreeGoalLimit(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      // 创建3个激活目标
      const goal1 = createLearningGoal({
        title: '目标1',
        description: '测试目标1',
        category: 'frontend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['HTML'],
        outcomes: ['掌握HTML'],
        status: 'active'
      })
      
      const goal2 = createLearningGoal({
        title: '目标2',
        description: '测试目标2',
        category: 'backend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['Python'],
        outcomes: ['掌握Python'],
        status: 'active'
      })
      
      const goal3 = createLearningGoal({
        title: '目标3',
        description: '测试目标3',
        category: 'ai',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['机器学习'],
        outcomes: ['掌握ML'],
        status: 'active'
      })
      
      // 验证3个目标都是激活状态
      const activeGoals = getActiveGoals()
      if (activeGoals.length !== 3) {
        return {
          name: '3个目标限制',
          passed: false,
          message: `应该有3个激活目标，实际有${activeGoals.length}个`
        }
      }
      
      // 尝试创建第4个激活目标，应该抛出错误
      try {
        createLearningGoal({
          title: '目标4',
          description: '这应该失败',
          category: 'data',
          priority: 3,
          targetLevel: 'beginner',
          estimatedTimeWeeks: 4,
          requiredSkills: ['数据分析'],
          outcomes: ['掌握数据分析'],
          status: 'active'
        })
        
        return {
          name: '3个目标限制',
          passed: false,
          message: '应该抛出错误但没有抛出'
        }
      } catch (error) {
        const expectedMessage = '最多只能同时激活3个学习目标'
        if (!(error instanceof Error) || !error.message.includes(expectedMessage)) {
          return {
            name: '3个目标限制',
            passed: false,
            message: `错误信息不正确: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      }
      
      // 测试暂停一个目标后可以激活新目标
      pauseGoal(goal1.id)
      
      const goal4 = createLearningGoal({
        title: '目标4',
        description: '现在应该可以创建',
        category: 'data',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['数据分析'],
        outcomes: ['掌握数据分析'],
        status: 'active'
      })
      
      const finalActiveGoals = getActiveGoals()
      if (finalActiveGoals.length !== 3) {
        return {
          name: '3个目标限制',
          passed: false,
          message: `暂停后应该有3个激活目标，实际有${finalActiveGoals.length}个`
        }
      }
      
      return {
        name: '3个目标限制',
        passed: true,
        message: '3个目标限制测试通过'
      }
      
    } catch (error) {
      return {
        name: '3个目标限制',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 测试2: 目标状态转换
   */
  private static async testGoalStatusTransitions(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      // 创建一个测试目标
      const goal = createLearningGoal({
        title: '状态转换测试',
        description: '测试目标状态转换',
        category: 'frontend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['CSS'],
        outcomes: ['掌握CSS'],
        status: 'active'
      })
      
      // 测试暂停
      const pausedGoal = pauseGoal(goal.id)
      if (!pausedGoal || pausedGoal.status !== 'paused') {
        return {
          name: '目标状态转换',
          passed: false,
          message: '暂停目标失败'
        }
      }
      
      // 测试重新激活
      const reactivatedGoal = activateGoal(goal.id)
      if (!reactivatedGoal || reactivatedGoal.status !== 'active') {
        return {
          name: '目标状态转换',
          passed: false,
          message: '重新激活目标失败'
        }
      }
      
      // 测试完成
      const completedGoal = completeGoal(goal.id)
      if (!completedGoal || completedGoal.status !== 'completed') {
        return {
          name: '目标状态转换',
          passed: false,
          message: '完成目标失败'
        }
      }
      
      // 创建另一个目标测试取消
      const goal2 = createLearningGoal({
        title: '取消测试',
        description: '测试取消功能',
        category: 'backend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['Node.js'],
        outcomes: ['掌握Node.js'],
        status: 'active'
      })
      
      const cancelledGoal = cancelGoal(goal2.id)
      if (!cancelledGoal || cancelledGoal.status !== 'cancelled') {
        return {
          name: '目标状态转换',
          passed: false,
          message: '取消目标失败'
        }
      }
      
      return {
        name: '目标状态转换',
        passed: true,
        message: '目标状态转换测试通过'
      }
      
    } catch (error) {
      return {
        name: '目标状态转换',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 测试3: 路径状态同步
   */
  private static async testPathStatusSync(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      // 创建目标和路径
      const goal = createLearningGoal({
        title: '路径同步测试',
        description: '测试路径状态同步',
        category: 'frontend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['JavaScript'],
        outcomes: ['掌握JavaScript'],
        status: 'active'
      })
      
      const path = createLearningPath({
        goalId: goal.id,
        title: '测试路径',
        description: '测试路径描述',
        totalEstimatedHours: 40,
        nodes: [],
        dependencies: [],
        milestones: [],
        version: '1.0.0',
        status: 'active'
      })
      
      // 暂停目标，检查路径是否同步暂停
      pauseGoal(goal.id)
      
      const paths = getLearningPaths()
      const updatedPath = paths.find(p => p.id === path.id)
      
      if (!updatedPath || updatedPath.status !== 'paused') {
        return {
          name: '路径状态同步',
          passed: false,
          message: '目标暂停时路径未同步暂停'
        }
      }
      
      // 重新激活目标，检查路径是否同步激活
      activateGoal(goal.id)
      
      const paths2 = getLearningPaths()
      const reactivatedPath = paths2.find(p => p.id === path.id)
      
      if (!reactivatedPath || reactivatedPath.status !== 'active') {
        return {
          name: '路径状态同步',
          passed: false,
          message: '目标激活时路径未同步激活'
        }
      }
      
      // 完成目标，检查路径是否同步完成
      completeGoal(goal.id)
      
      const paths3 = getLearningPaths()
      const completedPath = paths3.find(p => p.id === path.id)
      
      if (!completedPath || completedPath.status !== 'completed') {
        return {
          name: '路径状态同步',
          passed: false,
          message: '目标完成时路径未同步完成'
        }
      }
      
      return {
        name: '路径状态同步',
        passed: true,
        message: '路径状态同步测试通过'
      }
      
    } catch (error) {
      return {
        name: '路径状态同步',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 测试4: LLM工具集成
   */
  private static async testLLMToolIntegration(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      // 测试状态统计工具
      const stats = await agentToolExecutor.executeTool('get_goal_status_stats', {})
      
      if (!stats || typeof stats.total !== 'number' || typeof stats.canActivateMore !== 'boolean') {
        return {
          name: 'LLM工具集成',
          passed: false,
          message: '状态统计工具返回格式不正确'
        }
      }
      
      // 创建一个测试目标用于工具测试
      const goal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: 'LLM工具测试',
        description: '测试LLM工具创建目标',
        category: 'frontend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['React'],
        outcomes: ['掌握React'],
        status: 'active'
      })
      
      if (!goal || !goal.id) {
        return {
          name: 'LLM工具集成',
          passed: false,
          message: 'LLM创建目标工具失败'
        }
      }
      
      // 测试暂停工具
      const pausedGoal = await agentToolExecutor.executeTool('pause_goal', {
        goalId: goal.id
      })
      
      if (!pausedGoal || pausedGoal.status !== 'paused') {
        return {
          name: 'LLM工具集成',
          passed: false,
          message: 'LLM暂停目标工具失败'
        }
      }
      
      // 测试激活工具
      const activatedGoal = await agentToolExecutor.executeTool('activate_goal', {
        goalId: goal.id
      })
      
      if (!activatedGoal || activatedGoal.status !== 'active') {
        return {
          name: 'LLM工具集成',
          passed: false,
          message: 'LLM激活目标工具失败'
        }
      }
      
      return {
        name: 'LLM工具集成',
        passed: true,
        message: 'LLM工具集成测试通过'
      }
      
    } catch (error) {
      return {
        name: 'LLM工具集成',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 测试5: 状态统计
   */
  private static async testStatusStats(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      const stats = getGoalStatusStats()
      
      // 验证统计数据结构
      const requiredFields = ['total', 'active', 'completed', 'paused', 'cancelled', 'canActivateMore']
      for (const field of requiredFields) {
        if (!(field in stats)) {
          return {
            name: '状态统计',
            passed: false,
            message: `缺少统计字段: ${field}`
          }
        }
      }
      
      // 验证逻辑正确性
      if (stats.active < 0 || stats.active > 3) {
        return {
          name: '状态统计',
          passed: false,
          message: `激活目标数量超出范围: ${stats.active}`
        }
      }
      
      if (stats.canActivateMore !== (stats.active < 3)) {
        return {
          name: '状态统计',
          passed: false,
          message: `canActivateMore逻辑错误: active=${stats.active}, canActivateMore=${stats.canActivateMore}`
        }
      }
      
      return {
        name: '状态统计',
        passed: true,
        message: '状态统计测试通过'
      }
      
    } catch (error) {
      return {
        name: '状态统计',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 测试6: 边界条件
   */
  private static async testEdgeCases(): Promise<{ name: string; passed: boolean; message: string }> {
    try {
      // 测试激活不存在的目标
      try {
        activateGoal('nonexistent-id')
        return {
          name: '边界条件',
          passed: false,
          message: '激活不存在的目标应该失败'
        }
      } catch (error) {
        // 预期的错误
      }
      
      // 测试重复激活已激活的目标
      const goal = createLearningGoal({
        title: '边界测试',
        description: '测试边界条件',
        category: 'frontend',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['HTML'],
        outcomes: ['掌握HTML'],
        status: 'active'
      })
      
      const result = activateGoal(goal.id)
      if (!result || result.status !== 'active') {
        return {
          name: '边界条件',
          passed: false,
          message: '重复激活已激活目标失败'
        }
      }
      
      // 测试完成已完成的目标
      completeGoal(goal.id)
      const result2 = completeGoal(goal.id)
      if (!result2 || result2.status !== 'completed') {
        return {
          name: '边界条件',
          passed: false,
          message: '重复完成已完成目标失败'
        }
      }
      
      return {
        name: '边界条件',
        passed: true,
        message: '边界条件测试通过'
      }
      
    } catch (error) {
      return {
        name: '边界条件',
        passed: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }
  
  /**
   * 设置测试环境
   */
  private static async setupTestEnvironment(): Promise<void> {
    // 清理现有数据
    await this.cleanupTestData()
  }
  
  /**
   * 清理测试数据
   */
  private static async cleanupTestData(): Promise<void> {
    try {
      const goals = getLearningGoals()
      const testGoals = goals.filter(g => 
        g.title.includes('测试') || 
        g.title.includes('LLM') || 
        g.title.includes('边界') ||
        g.description.includes('测试')
      )
      
      for (const goal of testGoals) {
        try {
          // 删除关联的路径会在 deleteLearningGoal 中自动处理
          await agentToolExecutor.executeTool('delete_learning_goal', { goalId: goal.id })
        } catch (error) {
          console.warn(`清理测试目标失败: ${goal.id}`, error)
        }
      }
    } catch (error) {
      console.warn('清理测试数据失败:', error)
    }
  }
} 