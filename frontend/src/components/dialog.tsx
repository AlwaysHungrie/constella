'use client'

import Draggable from 'react-draggable'
import { useRef, useState, useEffect } from 'react'
import { DIALOG_COPY } from '@/copy/dialogs'

export interface DialogContent {
  TITLE: string
  CONTENT: string
}

export const Dialog = ({
  onClose,
  dialog,
}: {
  onClose: () => void
  dialog: DialogContent | null
}) => {
  const isOpen = !!dialog
  const nodeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 120, y: 30 })
  const [scrollState, setScrollState] = useState({
    height: 0,
    top: 0,
    isDragging: false,
    dragStartY: 0,
    initialScrollTop: 0,
  })

  // Reset scroll state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setScrollState({
        height: 0,
        top: 0,
        isDragging: false,
        dragStartY: 0,
        initialScrollTop: 0,
      })
    }
  }, [isOpen])

  // Handle scrollbar updates
  useEffect(() => {
    const content = contentRef.current
    if (!content || !isOpen) return

    const updateScrollbar = () => {
      const { scrollHeight, clientHeight, scrollTop } = content
      const scrollRatio = clientHeight / scrollHeight
      const thumbHeight = Math.max(clientHeight * scrollRatio, 30)
      const thumbTop = (scrollTop / scrollHeight) * clientHeight

      setScrollState((prev) => ({
        ...prev,
        height: thumbHeight,
        top: thumbTop,
      }))
    }

    updateScrollbar()
    content.addEventListener('scroll', updateScrollbar)
    return () => content.removeEventListener('scroll', updateScrollbar)
  }, [isOpen])

  // Handle scrollbar dragging
  useEffect(() => {
    const content = contentRef.current
    if (!content || !scrollState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const track = content.parentElement?.querySelector(
        '.custom-scrollbar-track'
      )
      if (!track) return

      const trackRect = track.getBoundingClientRect()
      const deltaY = e.clientY - scrollState.dragStartY
      const trackHeight = trackRect.height - scrollState.height
      const scrollRatio = deltaY / trackHeight
      const scrollRange = content.scrollHeight - content.clientHeight
      const newScrollTop = Math.max(
        0,
        Math.min(
          scrollState.initialScrollTop + scrollRange * scrollRatio,
          scrollRange
        )
      )

      content.scrollTop = newScrollTop
    }

    const handleMouseUp = () => {
      setScrollState((prev) => ({ ...prev, isDragging: false }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [scrollState])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" />

      {/* Draggable Dialog Window */}
      <Draggable
        // @ts-expect-error react-draggable strict fix
        nodeRef={nodeRef}
        handle=".dialog-handle"
        position={window.matchMedia('(pointer: coarse)').matches ? { x: 0, y: 0 } : position}
        onStop={(e, data) => {
          setPosition({ x: data.x, y: data.y })
        }}
        disabled={window.matchMedia('(pointer: coarse)').matches}
      >
        <div
          ref={nodeRef}
          className="relative bg-[#272822] border-[1px] border-[#75715E] w-[95vw] max-w-[700px] shadow-lg mx-4"
        >
          {/* Title Bar */}
          <div className="dialog-handle bg-[#3E3D32] text-[#F8F8F2] px-2 py-1.5 font-bold font-mono flex items-center cursor-move gap-2 text-sm sm:text-base">
            <span className="flex-grow truncate">
              {DIALOG_COPY.TITLE_PREFIX}/{dialog?.TITLE}
            </span>
            <button onClick={onClose} className="custom-close">
              -
            </button>
            <button onClick={onClose} className="custom-close">
              ×
            </button>
          </div>

          {/* Content with custom scrollbar */}
          <div className="custom-scrollbar-container">
            <div
              ref={contentRef}
              className="font-mono text-gray-300 space-y-4 max-h-[60vh] sm:max-h-[300px] overflow-y-auto custom-scrollbar pr-8 pl-2 sm:pl-4 py-3"
            >
              {dialog?.CONTENT.split('\n').map(
                (line, index) => (
                  <p key={index}>{line}</p>
                )
              )}
            </div>
            <div
              className="custom-scrollbar-track"
              onClick={(e) => {
                const track = e.currentTarget
                const trackRect = track.getBoundingClientRect()
                const clickY = e.clientY - trackRect.top
                const content = contentRef.current
                if (!content) return

                const scrollAmount = content.clientHeight
                const thumbMiddle = scrollState.top + scrollState.height / 2
                content.scrollTop +=
                  clickY < thumbMiddle ? -scrollAmount : scrollAmount
              }}
            >
              <div
                className="custom-scrollbar-thumb"
                style={{
                  height: `${scrollState.height}px`,
                  top: `${scrollState.top}px`,
                }}
                onMouseDown={(e) => {
                  // Prevent scrollbar dragging on touch screens
                  if (window.matchMedia('(pointer: coarse)').matches) return;
                  
                  e.stopPropagation()
                  setScrollState((prev) => ({
                    ...prev,
                    isDragging: true,
                    dragStartY: e.clientY,
                    initialScrollTop: contentRef.current?.scrollTop || 0,
                  }))
                }}
              />
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  )
}
