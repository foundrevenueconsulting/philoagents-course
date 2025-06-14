'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Phaser game component to avoid SSR issues
const PhaserGame = dynamic(() => import('@/components/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading PhiloAgents...</p>
      </div>
    </div>
  )
});

export default function GameClient() {
  return (
    <div className="pt-16 h-screen">
      <PhaserGame className="w-full h-full" />
    </div>
  );
}