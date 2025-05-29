import { AbilityAssessment, DEFAULT_WEIGHTS } from './types'

/**
 * 生成能力评估的 AI Prompt
 */
export const generateAssessmentPrompt = (input: string, type: 'resume' | 'questionnaire') => {
  const basePrompt = `你是一位经验丰富的技术面试官和职业发展顾问。请根据提供的${type === 'resume' ? '简历' : '问卷回答'}，对候选人进行全面的技术能力评估。

评估维度说明：
1. 编程基本功 (Programming) - 权重 ${DEFAULT_WEIGHTS.programming}
   - syntax: 基础语法掌握
   - dataStructures: 数据结构使用
   - errorHandling: 错误处理能力
   - codeQuality: 代码质量意识
   - tooling: 开发工具熟练度

2. 算法能力 (Algorithm) - 权重 ${DEFAULT_WEIGHTS.algorithm}
   - stringProcessing: 字符串处理
   - recursion: 递归思维
   - dynamicProgramming: 动态规划
   - graph: 图算法
   - tree: 树结构算法
   - sorting: 排序算法
   - searching: 搜索算法
   - greedy: 贪心算法

3. 项目能力 (Project) - 权重 ${DEFAULT_WEIGHTS.project}
   - planning: 项目规划
   - architecture: 架构设计
   - implementation: 实现能力
   - testing: 测试能力
   - deployment: 部署运维
   - documentation: 文档编写

4. 系统设计 (System Design) - 权重 ${DEFAULT_WEIGHTS.systemDesign}
   - scalability: 可扩展性设计
   - reliability: 可靠性设计
   - performance: 性能优化
   - security: 安全设计
   - databaseDesign: 数据库设计

5. 沟通协作 (Communication) - 权重 ${DEFAULT_WEIGHTS.communication}
   - codeReview: 代码评审
   - technicalWriting: 技术写作
   - teamCollaboration: 团队协作
   - mentoring: 指导他人
   - presentation: 演讲展示

评分标准：
- 0-20: 新手 (Novice) - 刚接触，需要大量指导
- 21-40: 初学者 (Beginner) - 有基础认知，能完成简单任务
- 41-60: 中级 (Intermediate) - 能独立工作，处理常见问题
- 61-80: 高级 (Advanced) - 熟练掌握，能解决复杂问题
- 81-100: 专家 (Expert) - 精通领域，能指导他人

请根据以下内容进行评估：
${input}

请严格按照以下 JSON 格式返回评估结果：
\`\`\`json
{
  "overallScore": 0,
  "dimensions": {
    "programming": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.programming},
      "skills": {
        "syntax": 0,
        "dataStructures": 0,
        "errorHandling": 0,
        "codeQuality": 0,
        "tooling": 0
      }
    },
    "algorithm": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.algorithm},
      "skills": {
        "stringProcessing": 0,
        "recursion": 0,
        "dynamicProgramming": 0,
        "graph": 0,
        "tree": 0,
        "sorting": 0,
        "searching": 0,
        "greedy": 0
      }
    },
    "project": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.project},
      "skills": {
        "planning": 0,
        "architecture": 0,
        "implementation": 0,
        "testing": 0,
        "deployment": 0,
        "documentation": 0
      }
    },
    "systemDesign": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.systemDesign},
      "skills": {
        "scalability": 0,
        "reliability": 0,
        "performance": 0,
        "security": 0,
        "databaseDesign": 0
      }
    },
    "communication": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.communication},
      "skills": {
        "codeReview": 0,
        "technicalWriting": 0,
        "teamCollaboration": 0,
        "mentoring": 0,
        "presentation": 0
      }
    }
  },
  "metadata": {
    "assessmentDate": "${new Date().toISOString()}",
    "assessmentMethod": "${type}",
    "confidence": 0
  },
  "report": {
    "summary": "",
    "strengths": [],
    "improvements": [],
    "recommendations": []
  }
}
\`\`\`

注意事项：
1. 每个技能评分必须是 0-100 的整数
2. 维度总分是其下所有技能的平均分
3. 总体评分是各维度加权平均分
4. confidence 表示评估置信度 (0-1)，基于信息完整度
5. 如果某些技能无法从材料中评估，给出保守估计
6. report 部分用中文，简洁明了，具有建设性`

  return basePrompt
}

export const SKILL_QUESTIONNAIRE = [
  {
    id: 'languages',
    question: '您掌握哪些编程语言？',
    options: ['Python', 'JavaScript', 'Java', 'C++', '其他']
  },
  {
    id: 'experience',
    question: '您的编程经验有多久？',
    options: ['少于1年', '1-3年', '3-5年', '5年以上']
  },
  {
    id: 'projects',
    question: '您完成过的最复杂的项目是？',
    options: ['个人练习项目', '课程作业', '开源贡献', '商业项目']
  }
] 