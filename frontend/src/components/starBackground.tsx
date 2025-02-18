'use client'

import React, { useCallback, useEffect, useRef } from 'react'

// Constants
const STAR_COUNT = 250
const STAR_BASE_SPEED = 0.8
const VANISHING_POINT_PERIOD = 1200
const PROJECTION_CONSTANT = 64
const MAX_Z_DISTANCE = 1000

interface Star {
  x: number
  y: number
  z: number
  size: number
}

interface CanvasContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

function initializeStars({ canvas }: CanvasContext): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: (Math.random() - 0.5) * canvas.width * 8,
    y: (Math.random() - 0.5) * canvas.height * 8,
    z: Math.random() * MAX_Z_DISTANCE,
    size: Math.random() * 0.5 + 0.5,
  }))
}

function setupCanvas({ canvas }: CanvasContext): () => void {
  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  return () => window.removeEventListener('resize', resizeCanvas)
}

function resetStar(star: Star, canvas: HTMLCanvasElement): void {
  star.z = MAX_Z_DISTANCE
  star.x = (Math.random() - 0.5) * canvas.width * 4
  star.y = (Math.random() - 0.5) * canvas.height * 4
  star.size = Math.random() * 0.5 + 0.5
}

function drawStar(
  star: Star,
  { canvas, ctx }: CanvasContext,
  vanishX: number,
  vanishY: number
): void {
  const px = (star.x / star.z) * PROJECTION_CONSTANT + canvas.width / vanishX
  const py = (star.y / star.z) * PROJECTION_CONSTANT + canvas.height / vanishY
  const psize = (1 - star.z / MAX_Z_DISTANCE) * 3 * star.size

  const gradient = ctx.createRadialGradient(px, py, 0, px, py, psize)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(px, py, psize, 0, Math.PI * 2)
  ctx.fill()
}

export default function StarBackground({ isPaused }: { isPaused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vanishXRef = useRef(2)
  const vanishYRef = useRef(2)
  const animationFrameRef = useRef<number>(0)
  const starsRef = useRef<Star[]>([])
  const animationTimeRef = useRef(0)
  const lastTimeRef = useRef(0)

  const updateVanishingPoints = useCallback(() => {
    vanishXRef.current = 2 + Math.sin(animationTimeRef.current / VANISHING_POINT_PERIOD) * 0.5
    vanishYRef.current = 2 + Math.cos((animationTimeRef.current / VANISHING_POINT_PERIOD) * 0.8) * 0.5
  }, [])

  const startAnimation = useCallback(
    (canvasContext: CanvasContext, stars: Star[], isPaused: boolean) => {
      const { canvas, ctx } = canvasContext

      function animate(currentTime: number) {
        if (!isPaused && lastTimeRef.current) {
          const deltaTime = currentTime - lastTimeRef.current
          animationTimeRef.current += deltaTime
        }
        lastTimeRef.current = currentTime

        if (!isPaused) {
          updateVanishingPoints()
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        stars.forEach((star) => {
          const speed =
            STAR_BASE_SPEED * (1 + (MAX_Z_DISTANCE - star.z) / MAX_Z_DISTANCE)

          if (!isPaused) {
            star.z -= speed
            if (star.z <= 0) {
              resetStar(star, canvas)
            }
          }

          drawStar(star, canvasContext, vanishXRef.current, vanishYRef.current)
        })

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    },
    [updateVanishingPoints]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const canvasContext: CanvasContext = { canvas, ctx }
    if (starsRef.current.length === 0) {
      starsRef.current = initializeStars(canvasContext)
    }

    setupCanvas(canvasContext)
    const cleanup = startAnimation(canvasContext, starsRef.current, isPaused)

    return cleanup
  }, [startAnimation, isPaused])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        zIndex: -1,
      }}
    />
  )
}
