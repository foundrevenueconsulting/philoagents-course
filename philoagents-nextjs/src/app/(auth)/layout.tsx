export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PhiloAgents
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            AI-Powered Philosophy Game
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}