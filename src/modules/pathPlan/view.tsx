import { log } from '../../utils/logger'

export const PathPlanView = () => {
  log('[pathPlan] View loaded')
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">学习路径</h2>
      <p className="text-gray-600">该模块正在开发中...</p>
    </div>
  )
}

export default PathPlanView 