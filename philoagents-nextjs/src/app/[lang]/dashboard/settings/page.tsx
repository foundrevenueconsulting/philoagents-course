import { auth } from "@clerk/nextjs/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const { userId } = await auth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Settings
      </h1>
      
      <SettingsClient userId={userId} />
    </div>
  );
}