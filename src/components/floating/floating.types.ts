export type WindowId = 'chat' | 'knowledge' | 'activity' | 'system'

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

export interface WindowConfig {
  id: WindowId
  title: string
  subtitle: string
  icon: string
  defaultPosition: WindowPosition
  defaultSize: WindowSize
  minSize: WindowSize
}

export interface WindowState {
  id: WindowId
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: WindowPosition
  size: WindowSize
}

export type WorkspaceLayout = 'default' | 'split' | 'focus-chat' | 'clean-core'
