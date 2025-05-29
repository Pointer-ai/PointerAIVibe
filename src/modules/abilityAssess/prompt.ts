/**
 * 能力评估相关的 AI 提示词模板
 */

export const ABILITY_ASSESS_PROMPT = `
你是一位专业的编程能力评估专家。请根据用户提供的简历或技能描述，评估其编程能力水平。

评估维度：
1. 编程语言掌握程度
2. 项目经验复杂度
3. 算法与数据结构基础
4. 系统设计能力
5. 学习能力与潜力

请按以下格式输出：
- 能力等级：初级/中级/高级
- 技能清单：列出已掌握的技能
- 优势领域：最擅长的方向
- 改进建议：需要提升的方面
`

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