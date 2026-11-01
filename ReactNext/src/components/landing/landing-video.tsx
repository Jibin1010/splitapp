'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Check,
  Maximize2,
  Pause,
  Play,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export function LandingVideoCard() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(true)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(30)
  const [showControls, setShowControls] = React.useState(true)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback blocked or failed, retrying muted:', err)
            video.muted = true
            setIsMuted(true)
            video.play().then(() => setIsPlaying(true)).catch(() => {})
          })
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      video.requestFullscreen().catch(() => {})
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl select-none">
      {/* Main Video Frame Container */}
      <div
        className="group relative overflow-hidden rounded-[30px] sm:rounded-[36px] border border-slate-800/10 bg-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.18),0_10px_20px_rgba(37,99,235,0.08)] aspect-16/10 cursor-pointer"
        onClick={togglePlay}
      >
        {/* Real Video from Production Folder with Upgraded Cover Image */}
        <video
          ref={videoRef}
          poster="/images/production/hero-video-poster.jpg"
          playsInline
          loop
          muted={isMuted}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="size-full object-cover"
          suppressHydrationWarning
        >
          <source src="/videos/production/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Center Frosted Glass Play Button — Visible only when paused/stopped */}
        {!isPlaying && (
          <div className="absolute inset-0 m-auto flex size-14 sm:size-16 items-center justify-center rounded-full bg-white/85 backdrop-blur-md text-slate-900 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95">
            <Play className="size-6 sm:size-7 fill-slate-900 translate-x-0.5" />
          </div>
        )}

        {/* Bottom Interactive Video Controls Bar — Visible only during playback on hover */}
        {isPlaying && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2.5 sm:gap-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3.5 sm:px-5 pb-3 sm:pb-4 pt-6 text-white text-[11px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="p-1 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="size-3.5 sm:size-4 fill-white" />
              ) : (
                <Play className="size-3.5 sm:size-4 fill-white translate-x-0.2" />
              )}
            </button>

            <span className="font-mono tabular-nums text-[10px] sm:text-xs shrink-0 text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Scrubber Range Input */}
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 10}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek video position"
                className="w-full h-1 sm:h-1.5 appearance-none rounded-full bg-white/30 accent-white cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="size-3.5 sm:size-4" /> : <Volume2 className="size-3.5 sm:size-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              className="p-1 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Maximize2 className="size-3.5 sm:size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
