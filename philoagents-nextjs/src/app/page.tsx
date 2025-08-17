import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthInfo } from "@/lib/auth";

export default async function Home() {
  const { userId } = await getAuthInfo();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            🧠 The BioTypes Arena
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Master the art of understanding human biology andtemperaments through AI-powered BioType training. 
            Practice recognition skills, engage in multi-way philosophical discussions, and explore 
            the depths of personality science in an interactive learning environment.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="px-8 py-4 rounded-lg font-semibold transition-all text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#B8623F' }}
            >
              Begin Training
            </Link>
            <Link
              href="/sign-in"
              className="border-2 bg-white hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              style={{ borderColor: '#B8623F', color: '#B8623F' }}
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🔍 BioType Recognition
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Train your ability to identify biological temperaments from facial features and 
                body language with our advanced image recognition practice system.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🗣️ Multi-Way Discussions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Watch different AI BioType agents collaborate and debate on topics of your choice 
                in real-time philosophical conversations.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                📊 Progress Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your recognition accuracy, response times, and learning progress 
                with detailed analytics and personalized insights.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🎮 Interactive Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Engage with historical philosophers in an immersive game world while 
                building deep understanding of personality types and human nature.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl max-w-4xl mx-auto border-t-4" style={{ borderTopColor: '#B8623F' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Master the Four Classical Temperaments
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Learn to recognize and understand the biological foundations of human personality through our comprehensive training system.
            </p>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl mb-2">🜂</div>
                <div className="font-semibold text-red-800 dark:text-red-200">Choleric</div>
                <div className="text-red-600 dark:text-red-300">Fire • Leader • Ambitious</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">🜄</div>
                <div className="font-semibold text-blue-800 dark:text-blue-200">Phlegmatic</div>
                <div className="text-blue-600 dark:text-blue-300">Earth • Peaceful • Steady</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl mb-2">🜁</div>
                <div className="font-semibold text-yellow-800 dark:text-yellow-200">Sanguine</div>
                <div className="text-yellow-600 dark:text-yellow-300">Air • Social • Optimistic</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl mb-2">🜃</div>
                <div className="font-semibold text-purple-800 dark:text-purple-200">Melancholic</div>
                <div className="text-purple-600 dark:text-purple-300">Water • Analytical • Thoughtful</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
