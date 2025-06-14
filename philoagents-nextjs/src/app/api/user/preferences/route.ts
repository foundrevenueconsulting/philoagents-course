import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/mongodb/userService";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user
    const user = await UserService.getOrCreateUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ preferences: user.preferences });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get preferences from request
    const preferences = await req.json();
    
    // Validate preferences (only allow known fields)
    const allowedFields = [
      'favoritePhilosopher',
      'gameVolume',
      'conversationSpeed',
      'theme',
      'language',
      'shareConversations',
      'publicProfile'
    ];
    
    const filteredPreferences = Object.keys(preferences)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = preferences[key];
        return obj;
      }, {} as any);

    // Update preferences
    const updatedUser = await UserService.updatePreferences(userId, filteredPreferences);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Track analytics event
    await UserService.trackEvent(
      userId,
      "preferences_updated",
      { updatedFields: Object.keys(filteredPreferences) }
    );

    return NextResponse.json({ preferences: updatedUser.preferences });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}