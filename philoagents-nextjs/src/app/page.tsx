import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  let userId = null;
  
  // Only use auth if Clerk keys are configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';
  
  if (hasClerkKey) {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Great Game of Life
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Engage in philosophical conversations with AI-powered historical philosophers. 
            Explore deep questions about consciousness, reality, ethics, and existence in an 
            interactive multiplayer world.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Your Journey
            </Link>
            <Link
              href="/sign-in"
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                AI Philosophers
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Converse with Socrates, Aristotle, Descartes, and more. Each philosopher 
                has their unique perspective and style.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Multiplayer World
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Explore an interactive world with other players. Share insights 
                and engage in group philosophical discussions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Personal Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your philosophical conversations and insights. Build your 
                understanding over time with persistent conversation history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
