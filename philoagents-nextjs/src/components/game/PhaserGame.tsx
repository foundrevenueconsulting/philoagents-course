'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import Phaser from 'phaser'
import { Preloader } from '@/lib/phaser/scenes/Preloader'
import { MainMenu } from '@/lib/phaser/scenes/MainMenu'
import { Game } from '@/lib/phaser/scenes/Game'
import { PauseMenu } from '@/lib/phaser/scenes/PauseMenu'

interface PhaserGameProps {
  className?: string
}

export default function PhaserGame({ className = "" }: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    // Don't initialize game until user data is loaded and we have a ref
    if (!isLoaded || !gameRef.current) return

    // Prevent multiple game instances
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      parent: gameRef.current,
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [Preloader, MainMenu, Game, PauseMenu],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
          width: 800,
          height: 600
        },
        max: {
          width: 1600,
          height: 1200
        }
      },
      // Pass user context to game on initialization
      callbacks: {
        preBoot: (game) => {
          // Set user data in game registry for access across scenes
          game.registry.set('userId', user?.id || 'anonymous')
          game.registry.set('userName', user?.fullName || user?.firstName || 'Anonymous Player')
          game.registry.set('userEmail', user?.emailAddresses?.[0]?.emailAddress || '')
          game.registry.set('userAvatar', user?.imageUrl || '')
          game.registry.set('isAuthenticated', !!user)
          
          // Set API endpoints from environment
          game.registry.set('apiUrl', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          game.registry.set('multiplayerUrl', process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:2567')
          
          console.log('PhiloAgents Game initialized with user context:', {
            userId: user?.id || 'anonymous',
            userName: user?.fullName || 'Anonymous Player',
            isAuthenticated: !!user
          })
        }
      }
    }

    // Create the Phaser game instance
    phaserGameRef.current = new Phaser.Game(config)

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [user, isLoaded])

  // Show loading state while user data loads
  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading PhiloAgents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={gameRef} 
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
      
      {/* Game overlay UI (optional) */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
        {user ? `Welcome, ${user.firstName}!` : 'Anonymous Player'}
      </div>
    </div>
  )
}