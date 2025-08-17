"use client";

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function NavigationHeader() {
  const pathname = usePathname();
  
  // Don't show navigation on game page, auth pages, or home page
  if (pathname === '/game' || pathname.startsWith('/sign-') || pathname === '/') {
    return null;
  }

  // Check if Clerk is configured (client-side fallback)
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';

  return (
    <nav className="shadow border-b border-gray-200 dark:border-slate-700" style={{ backgroundColor: '#B8623F' }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and main nav */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">
                🧠 The BioTypes Arena
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dashboard' 
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
              
              <Link 
                href="/discussions"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith('/discussions')
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Discussions
              </Link>
              
              <Link 
                href="/practice"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/practice'
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Practice
              </Link>
              
              <Link 
                href="/game"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/game'
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                🎮 Game
              </Link>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Menu
                </Button>
              </Link>
            </div>
            
            {/* User profile */}
            {hasClerkKey ? (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            ) : (
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}