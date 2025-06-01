/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 重构系统UI组件统一导出

// Button组件
export { Button } from './Button/Button'
export type { ButtonProps } from './Button/Button'

// Card组件
export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from './Card/Card'

// Input组件
export { 
  Input, 
  Label, 
  FormField 
} from './Input/Input'

// Badge组件
export { 
  Badge, 
  StatusBadge, 
  CountBadge 
} from './Badge/Badge'

// ProgressBar组件
export { 
  ProgressBar, 
  SkillProgress, 
  StepProgress 
} from './ProgressBar/ProgressBar'

// Loading组件
export { 
  Loading, 
  PageLoading, 
  ButtonLoading, 
  Skeleton 
} from './Loading/Loading'

// Alert组件
export { 
  Alert, 
  Toast, 
  ToastContainer, 
  toastManager, 
  toast 
} from './Alert/Alert'

// Modal组件
export { 
  Modal, 
  ConfirmModal, 
  FormModal, 
  ImageModal 
} from './Modal/Modal'

// 重构系统UI组件库版本
export const UI_VERSION = '1.0.0'

// 所有组件的集合（用于文档生成或调试）
export const UI_COMPONENTS = {
  Button: 'Button',
  Card: 'Card',
  Input: 'Input', 
  Badge: 'Badge',
  ProgressBar: 'ProgressBar',
  Loading: 'Loading',
  Alert: 'Alert',
  Modal: 'Modal'
} as const

// 重构系统UI组件库 - 生产就绪
// 包含完整的基础组件系统，覆盖所有常用UI场景 