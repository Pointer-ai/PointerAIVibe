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

import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
  FormField,
  Badge,
  StatusBadge,
  CountBadge,
  ProgressBar,
  SkillProgress,
  StepProgress,
  Loading,
  PageLoading,
  ButtonLoading,
  Skeleton,
  Alert,
  Toast,
  ToastContainer,
  toast,
  Modal,
  ConfirmModal,
  FormModal,
  ImageModal
} from '../components/ui'

/**
 * 重构系统 - UI组件展示页面
 * 
 * 展示所有重构后的UI组件及其用法
 */
interface UIShowcaseProps {
  onNavigate?: (view: string) => void
}

export const UIShowcase: React.FC<UIShowcaseProps> = ({ onNavigate }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* 返回按钮 */}
      {onNavigate && (
        <div className="mb-6">
          <Button 
            variant="secondary" 
            onClick={() => onNavigate('main')}
            className="mb-4"
          >
            ← 返回主页
          </Button>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>🎨 重构系统UI组件库</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            这里展示了重构系统中所有的基础UI组件，包括它们的不同变体和使用方法。
          </p>
        </CardContent>
      </Card>

      {/* Button组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>按钮组件 (Button)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">不同变体：</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">主要按钮</Button>
                <Button variant="secondary">次要按钮</Button>
                <Button variant="success">成功按钮</Button>
                <Button variant="danger">危险按钮</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">不同大小：</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">小按钮</Button>
                <Button size="md">中按钮</Button>
                <Button size="lg">大按钮</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">状态：</h4>
              <div className="flex flex-wrap gap-2">
                <Button disabled>禁用状态</Button>
                <Button loading>加载中</Button>
                <Button onClick={handleLoadingDemo}>
                  {loading ? <ButtonLoading /> : '点击测试加载'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>卡片组件 (Card)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default" size="sm">
              <CardHeader>
                <CardTitle>默认卡片</CardTitle>
              </CardHeader>
              <CardContent>
                这是一个默认样式的卡片，适用于一般内容展示。
              </CardContent>
            </Card>
            
            <Card variant="shadow" hover>
              <CardHeader>
                <CardTitle>阴影卡片</CardTitle>
              </CardHeader>
              <CardContent>
                这是一个带阴影的可悬停卡片。
              </CardContent>
              <CardFooter>
                <Button size="sm">操作</Button>
              </CardFooter>
            </Card>
            
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>轮廓卡片</CardTitle>
              </CardHeader>
              <CardContent>
                这是一个轮廓样式的卡片。
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Input组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>输入框组件 (Input)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <FormField label="基础输入框" required>
              <Input 
                placeholder="请输入内容"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </FormField>
            
            <FormField label="成功状态" success="输入正确！">
              <Input value="正确的内容" success />
            </FormField>
            
            <FormField label="错误状态" error="输入格式不正确">
              <Input value="错误内容" error />
            </FormField>
            
            <FormField label="禁用状态">
              <Input value="禁用的输入框" disabled />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Badge组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>徽章组件 (Badge)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">不同变体：</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">默认</Badge>
                <Badge variant="primary">主要</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="warning">警告</Badge>
                <Badge variant="danger">危险</Badge>
                <Badge variant="info">信息</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">轮廓样式：</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary" outline>轮廓主要</Badge>
                <Badge variant="success" outline>轮廓成功</Badge>
                <Badge variant="warning" outline>轮廓警告</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">状态和数字徽章：</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <StatusBadge status="active" />
                <StatusBadge status="pending" />
                <StatusBadge status="completed" />
                <CountBadge count={5} />
                <CountBadge count={99} />
                <CountBadge count={100} max={99} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ProgressBar组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>进度条组件 (ProgressBar)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">基础进度条：</h4>
              <ProgressBar value={30} showLabel labelPosition="outside" />
              <ProgressBar value={60} variant="success" showLabel className="mt-2" />
              <ProgressBar value={80} variant="warning" showLabel className="mt-2" />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">技能进度条：</h4>
              <SkillProgress 
                skillName="React"
                currentLevel={75}
                targetLevel={90}
              />
              <SkillProgress 
                skillName="TypeScript"
                currentLevel={60}
                targetLevel={85}
                className="mt-3"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">步骤进度条：</h4>
              <StepProgress 
                steps={['开始', '配置', '开发', '测试', '部署']}
                currentStep={2}
                completedSteps={[0, 1]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>加载组件 (Loading)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">不同样式：</h4>
              <div className="flex flex-wrap gap-8 items-center">
                <Loading variant="spinner" size="md" text="加载中..." />
                <Loading variant="dots" size="md" />
                <Loading variant="pulse" size="md" />
                <Loading variant="bars" size="md" />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">骨架屏：</h4>
              <div className="space-y-2">
                <Skeleton width="100%" height="2rem" />
                <Skeleton width="80%" height="1rem" />
                <Skeleton width="60%" height="1rem" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>警告组件 (Alert)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="info" title="信息提示">
              这是一个信息类型的提示框。
            </Alert>
            
            <Alert variant="success" title="操作成功" closable>
              您的操作已成功完成！
            </Alert>
            
            <Alert variant="warning" title="注意">
              请注意以下事项...
            </Alert>
            
            <Alert variant="error" title="错误" closable>
              发生了一个错误，请重试。
            </Alert>
            
            <div className="pt-4">
              <h4 className="font-medium mb-2">Toast通知：</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast.info('这是一个信息通知')}>信息通知</Button>
                <Button onClick={() => toast.success('操作成功！')}>成功通知</Button>
                <Button onClick={() => toast.warning('请注意')}>警告通知</Button>
                <Button onClick={() => toast.error('操作失败')}>错误通知</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal组件展示 */}
      <Card>
        <CardHeader>
          <CardTitle>对话框组件 (Modal)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)}>基础对话框</Button>
            <Button onClick={() => setConfirmModalOpen(true)}>确认对话框</Button>
            <Button onClick={() => setFormModalOpen(true)}>表单对话框</Button>
          </div>
        </CardContent>
      </Card>

      {/* 对话框实例 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="基础对话框"
        size="md"
      >
        <p>这是一个基础的对话框示例。</p>
        <p className="mt-2">您可以在这里放置任何内容。</p>
      </Modal>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          toast.success('确认操作已执行')
        }}
        title="确认删除"
        content="您确定要删除这个项目吗？此操作不可撤销。"
        variant="danger"
      />

      <FormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={() => {
          toast.success('表单已提交')
          setFormModalOpen(false)
        }}
        title="编辑信息"
      >
        <div className="space-y-4">
          <FormField label="名称" required>
            <Input placeholder="请输入名称" />
          </FormField>
          <FormField label="描述">
            <Input placeholder="请输入描述" />
          </FormField>
        </div>
      </FormModal>

      {/* Toast容器 */}
      <ToastContainer />
    </div>
  )
}

export default UIShowcase 