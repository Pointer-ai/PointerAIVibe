import { DEFAULT_WEIGHTS } from './types'

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

重要说明：
1. 对于每个技能，请返回一个对象，包含：
   - score: 分数 (0-100)
   - confidence: 置信度 (0-1)，表示基于简历信息得出该分数的把握程度
   - isInferred: 布尔值，如果是基于整体信息推理而非直接证据，设为 true
2. 如果简历中有明确的证据（如具体项目经验、技能描述），置信度应该高（0.8-1.0）
3. 如果只能通过推理得出（如从整体经验推断），置信度应该低（0.3-0.7），并设置 isInferred 为 true
4. 不要给出没有依据的高分，宁可保守评估

**📝 关键改进：在 report 部分，请提供详细和实用的内容：**

- **summary**: 150-200字的综合评估总结，包含整体水平判断、技术栈特点、发展阶段分析
- **strengths**: 3-5个具体的优势领域，每个20-30字，要具体到技术点或能力表现
- **improvements**: 3-5个具体的待改进项，每个20-30字，要明确指出薄弱环节和提升方向
- **recommendations**: 5-8个具体的发展建议，每个30-50字，要给出可执行的行动建议

请根据以下内容进行评估：
${input}

请严格按照以下 JSON 格式返回评估结果，必须用 \`\`\`json 和 \`\`\` 包围：

\`\`\`json
{
  "overallScore": 0,
  "dimensions": {
    "programming": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.programming},
      "skills": {
        "syntax": { "score": 0, "confidence": 0.0, "isInferred": false },
        "dataStructures": { "score": 0, "confidence": 0.0, "isInferred": false },
        "errorHandling": { "score": 0, "confidence": 0.0, "isInferred": false },
        "codeQuality": { "score": 0, "confidence": 0.0, "isInferred": false },
        "tooling": { "score": 0, "confidence": 0.0, "isInferred": false }
      }
    },
    "algorithm": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.algorithm},
      "skills": {
        "stringProcessing": { "score": 0, "confidence": 0.0, "isInferred": false },
        "recursion": { "score": 0, "confidence": 0.0, "isInferred": false },
        "dynamicProgramming": { "score": 0, "confidence": 0.0, "isInferred": false },
        "graph": { "score": 0, "confidence": 0.0, "isInferred": false },
        "tree": { "score": 0, "confidence": 0.0, "isInferred": false },
        "sorting": { "score": 0, "confidence": 0.0, "isInferred": false },
        "searching": { "score": 0, "confidence": 0.0, "isInferred": false },
        "greedy": { "score": 0, "confidence": 0.0, "isInferred": false }
      }
    },
    "project": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.project},
      "skills": {
        "planning": { "score": 0, "confidence": 0.0, "isInferred": false },
        "architecture": { "score": 0, "confidence": 0.0, "isInferred": false },
        "implementation": { "score": 0, "confidence": 0.0, "isInferred": false },
        "testing": { "score": 0, "confidence": 0.0, "isInferred": false },
        "deployment": { "score": 0, "confidence": 0.0, "isInferred": false },
        "documentation": { "score": 0, "confidence": 0.0, "isInferred": false }
      }
    },
    "systemDesign": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.systemDesign},
      "skills": {
        "scalability": { "score": 0, "confidence": 0.0, "isInferred": false },
        "reliability": { "score": 0, "confidence": 0.0, "isInferred": false },
        "performance": { "score": 0, "confidence": 0.0, "isInferred": false },
        "security": { "score": 0, "confidence": 0.0, "isInferred": false },
        "databaseDesign": { "score": 0, "confidence": 0.0, "isInferred": false }
      }
    },
    "communication": {
      "score": 0,
      "weight": ${DEFAULT_WEIGHTS.communication},
      "skills": {
        "codeReview": { "score": 0, "confidence": 0.0, "isInferred": false },
        "technicalWriting": { "score": 0, "confidence": 0.0, "isInferred": false },
        "teamCollaboration": { "score": 0, "confidence": 0.0, "isInferred": false },
        "mentoring": { "score": 0, "confidence": 0.0, "isInferred": false },
        "presentation": { "score": 0, "confidence": 0.0, "isInferred": false }
      }
    }
  },
  "metadata": {
    "assessmentDate": "${new Date().toISOString()}",
    "assessmentMethod": "${type}",
    "confidence": 0
  },
  "report": {
    "summary": "请提供150-200字的综合评估总结，包含整体水平判断、技术栈特点、发展阶段分析",
    "strengths": [
      "具体优势领域1 - 20-30字描述",
      "具体优势领域2 - 20-30字描述",
      "具体优势领域3 - 20-30字描述"
    ],
    "improvements": [
      "具体待改进项1 - 20-30字描述薄弱环节",
      "具体待改进项2 - 20-30字描述薄弱环节", 
      "具体待改进项3 - 20-30字描述薄弱环节"
    ],
    "recommendations": [
      "发展建议1 - 30-50字的可执行建议",
      "发展建议2 - 30-50字的可执行建议",
      "发展建议3 - 30-50字的可执行建议",
      "发展建议4 - 30-50字的可执行建议",
      "发展建议5 - 30-50字的可执行建议"
    ]
  }
}
\`\`\`

重要：
1. 必须严格按照上述 JSON 格式返回
2. 维度总分是其下所有技能的平均分
3. 总体评分是各维度加权平均分
4. metadata.confidence 表示整体评估置信度 (0-1)，基于信息完整度
5. 如果某些技能无法从材料中评估，给出保守估计，并标记低置信度和 isInferred
6. report 部分用中文，简洁明了，具有建设性
7. 请确保返回的是有效的 JSON 格式
8. 📋 特别注意：strengths、improvements、recommendations 必须是具体且实用的内容，避免泛泛而谈`

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