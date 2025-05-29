import React, { useState, useRef, useEffect } from 'react'

interface AvatarMenuProps {
  avatar: string
  name: string
  onSwitch: () => void
  onLogout: () => void
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ avatar, name, onSwitch, onLogout }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <span className="text-xl">{avatar}</span>
        <span>{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
          <button
            onClick={() => {
              setOpen(false)
              onSwitch()
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
          >
            切换档案
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

export default AvatarMenu
