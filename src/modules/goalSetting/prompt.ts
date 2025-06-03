/**
 * 目标设置相关的 AI 提示词模板
 */

export const GOAL_ANALYSIS_PROMPT = `
你是一位经验丰富的编程学习顾问。请帮助分析用户的学习目标。

分析要点：
1. 目标的具体性和可行性
2. 实现目标所需的技能栈
3. 预计学习时长
4. 可能遇到的挑战

输出格式：
- 目标解析：具体化用户的目标
- 技能要求：列出必需掌握的技能
- 时间规划：合理的学习周期
- 里程碑：关键检查点
` 

/**
 * 生成目标推荐的 AI Prompt
 */
export const generateGoalRecommendationPrompt = (
  categories: string[],
  answers: Record<string, any>,
  ability: any,
  existingGoals: any[]
): string => {
  return `你是一位专业的学习规划顾问。请基于以下信息为用户推荐合适的学习目标：

用户选择的兴趣领域：${categories.join(', ')}
问卷回答：${JSON.stringify(answers, null, 2)}
能力评估：${ability ? JSON.stringify(ability, null, 2) : '暂无'}
现有目标：${existingGoals.length > 0 ? JSON.stringify(existingGoals, null, 2) : '暂无'}

请生成3-5个具体的学习目标推荐，每个推荐包含具体的技能点和预估时间。`
}

/**
 * 生成自然语言目标解析的 AI Prompt
 */
export const generateNaturalLanguageGoalPrompt = (
  userInput: string,
  userProfile?: any
): string => {
  const profileContext = userProfile ? `
用户能力概况：
- 总体评分：${userProfile.overallScore || '未知'}
- 编程能力：${userProfile.dimensions?.programming?.score || '未知'}
- 算法能力：${userProfile.dimensions?.algorithm?.score || '未知'}
- 项目能力：${userProfile.dimensions?.project?.score || '未知'}
- 系统设计：${userProfile.dimensions?.systemDesign?.score || '未知'}
- 沟通协作：${userProfile.dimensions?.communication?.score || '未知'}

用户优势：${userProfile.report?.strengths?.join(', ') || '暂无'}
待改进项：${userProfile.report?.improvements?.join(', ') || '暂无'}
` : ''

  return `你是一位专业的学习规划和职业发展顾问。用户描述了他们的工作需求或想要达成的目标，请基于这个描述生成具体的学习目标和路径。

用户输入：
"${userInput}"

${profileContext}

请基于用户的描述，解析并生成1-3个具体的学习目标。每个目标都要包含完整的学习路径规划。

## 📋 解析要求

### 🎯 目标识别
1. **准确理解用户意图**：深度分析用户描述，识别真实需求
2. **技能拆解**：将复杂目标拆解为具体的技能点
3. **难度评估**：根据用户当前能力评估合适的学习难度
4. **时间规划**：给出现实可行的时间预估

### 🛣️ 路径设计原则
1. **循序渐进**：从基础到进阶，逻辑清晰
2. **实践导向**：理论与实践结合，项目驱动学习
3. **个性化**：基于用户背景调整难度和重点
4. **可衡量**：每个节点都有明确的学习成果

### 🔧 处理各种情况
1. **描述模糊**：推断最可能的学习需求，给出多种选择
2. **技术过时**：推荐现代化的技术方案
3. **目标过大**：拆分为可管理的子目标
4. **目标过小**：扩展为更完整的技能体系

### 📊 输出格式
必须返回标准JSON格式，包含完整的目标解析和路径规划：

\`\`\`json
{
  "success": true,
  "goals": [
    {
      "title": "具体目标标题",
      "description": "目标的详细描述，说明能达成什么效果",
      "category": "目标分类（frontend/backend/fullstack/automation/ai/mobile/game/data等）",
      "priority": 优先级数字(1-5),
      "difficulty": "难度等级（beginner/intermediate/advanced）",
      "estimatedTimeWeeks": 预估学习周数,
      "requiredSkills": ["需要掌握的技能1", "技能2", "技能3"],
      "learningPath": [
        {
          "id": "节点唯一标识",
          "title": "学习节点标题",
          "description": "节点详细描述，包含具体学习内容和目标",
          "type": "节点类型（theory/practice/project/assessment）",
          "order": 执行顺序数字,
          "estimatedHours": 预估学习小时数,
          "prerequisites": ["前置要求1", "前置要求2"],
          "skills": ["此节点涉及的技能1", "技能2"],
          "resources": [
            {
              "type": "资源类型（video/article/book/course/documentation/practice）",
              "title": "资源标题",
              "description": "资源描述"
            }
          ]
        }
      ],
      "outcomes": ["学习成果1", "成果2", "成果3"],
      "reasoning": "生成此目标的详细理由，为什么适合用户",
      "confidence": 置信度数字(0-1)
    }
  ],
  "originalInput": "用户原始输入",
  "suggestions": ["补充建议1", "建议2", "建议3"]
}
\`\`\`

### 🚨 质量要求
1. **JSON格式严格正确**：确保所有括号、引号、逗号正确闭合
2. **内容具体实用**：避免空泛描述，给出可执行的具体步骤
3. **时间预估现实**：基于正常学习速度给出合理预估
4. **技能匹配**：推荐的技能要与用户目标高度相关

### 💡 常见场景处理示例
- "自动化处理工作表格" → Excel自动化 + Python脚本 + 数据处理
- "开发一个网站" → 前端技术 + 后端基础 + 部署运维
- "做数据分析" → Python数据科学 + SQL + 可视化工具
- "学习AI" → 机器学习基础 + Python实践 + 项目应用

现在请分析用户输入并生成完整的学习目标和路径规划。`
}

/**
 * 清理并修复 JSON 格式错误的函数（参考评测系统的实现）
 */
export const cleanupGoalJSONString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim()
  
  // 移除可能的 markdown 代码块标记
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  
  // 修复常见的不完整布尔值
  cleaned = cleaned.replace(/"success":\s*tru$/g, '"success": true')
  cleaned = cleaned.replace(/"success":\s*fals$/g, '"success": false')
  
  // 修复其他常见的不完整值
  cleaned = cleaned.replace(/:\s*fals$/g, ': false')
  cleaned = cleaned.replace(/:\s*tru$/g, ': true')
  cleaned = cleaned.replace(/:\s*nul$/g, ': null')
  
  // 确保字符串末尾有正确的闭合括号
  const openBraces = (cleaned.match(/\{/g) || []).length
  const closeBraces = (cleaned.match(/\}/g) || []).length
  const openBrackets = (cleaned.match(/\[/g) || []).length
  const closeBrackets = (cleaned.match(/\]/g) || []).length
  
  if (openBraces > closeBraces) {
    cleaned += '}'.repeat(openBraces - closeBraces)
  }
  
  if (openBrackets > closeBrackets) {
    cleaned += ']'.repeat(openBrackets - closeBrackets)
  }
  
  // 尝试修复缺少的逗号（更保守的方法）
  cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"')
  cleaned = cleaned.replace(/\}\s*\n\s*"/g, '},\n"')
  cleaned = cleaned.replace(/\]\s*\n\s*"/g, '],\n"')
  
  return cleaned
}

/**
 * 验证和修复目标解析结果
 */
export const validateAndFixGoalParseResult = (result: any): any => {
  // 确保基本结构存在
  if (!result.success) {
    result.success = false
  }
  
  if (!result.goals || !Array.isArray(result.goals)) {
    result.goals = []
  }
  
  // 验证每个目标的结构
  result.goals = result.goals.map((goal: any) => {
    // 确保必需字段存在
    if (!goal.title) goal.title = '学习目标'
    if (!goal.description) goal.description = '待完善的学习目标描述'
    if (!goal.category) goal.category = 'general'
    if (typeof goal.priority !== 'number') goal.priority = 3
    if (!goal.difficulty) goal.difficulty = 'intermediate'
    if (typeof goal.estimatedTimeWeeks !== 'number') goal.estimatedTimeWeeks = 4
    if (!Array.isArray(goal.requiredSkills)) goal.requiredSkills = []
    if (!Array.isArray(goal.learningPath)) goal.learningPath = []
    if (!Array.isArray(goal.outcomes)) goal.outcomes = []
    if (!goal.reasoning) goal.reasoning = '根据用户需求生成的学习目标'
    if (typeof goal.confidence !== 'number') goal.confidence = 0.8
    
    // 验证学习路径节点
    goal.learningPath = goal.learningPath.map((node: any, index: number) => {
      if (!node.id) node.id = `node_${index + 1}`
      if (!node.title) node.title = `学习节点 ${index + 1}`
      if (!node.description) node.description = '学习节点描述'
      if (!node.type) node.type = 'theory'
      if (typeof node.order !== 'number') node.order = index + 1
      if (typeof node.estimatedHours !== 'number') node.estimatedHours = 8
      if (!Array.isArray(node.prerequisites)) node.prerequisites = []
      if (!Array.isArray(node.skills)) node.skills = []
      if (!Array.isArray(node.resources)) node.resources = []
      
      return node
    })
    
    return goal
  })
  
  if (!result.originalInput) {
    result.originalInput = ''
  }
  
  if (!Array.isArray(result.suggestions)) {
    result.suggestions = []
  }
  
  return result
} 