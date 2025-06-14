import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/mongodb/userService";
import { UserPreferences, PreferencesFormData } from "@/types/api";
import { FormValidator, TypeSafeConverter } from "@/utils/TypeSafeConverters";

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
    const rawPreferences = await req.json();
    
    // Validate and convert preferences with type safety
    const validatedPreferences: Partial<UserPreferences> = {};
    
    // Validate each preference field with proper typing
    if (rawPreferences.favoritePhilosopher !== undefined) {
      validatedPreferences.favoritePhilosopher = FormValidator.validateOptionalString(
        rawPreferences.favoritePhilosopher, 50
      );
    }
    
    if (rawPreferences.gameVolume !== undefined) {
      const volume = TypeSafeConverter.toNumber(rawPreferences.gameVolume);
      if (volume >= 0 && volume <= 100) {
        validatedPreferences.gameVolume = volume;
      }
    }
    
    if (rawPreferences.conversationSpeed !== undefined) {
      const speed = TypeSafeConverter.toNumber(rawPreferences.conversationSpeed);
      if (speed >= 0.5 && speed <= 3.0) {
        validatedPreferences.conversationSpeed = speed;
      }
    }
    
    if (rawPreferences.theme !== undefined) {
      const theme = TypeSafeConverter.toString(rawPreferences.theme);
      if (['light', 'dark', 'system'].includes(theme)) {
        validatedPreferences.theme = theme as 'light' | 'dark' | 'system';
      }
    }
    
    if (rawPreferences.language !== undefined) {
      validatedPreferences.language = FormValidator.validateOptionalString(
        rawPreferences.language, 10
      );
    }
    
    if (rawPreferences.shareConversations !== undefined) {
      validatedPreferences.shareConversations = TypeSafeConverter.toBoolean(
        rawPreferences.shareConversations
      );
    }
    
    if (rawPreferences.publicProfile !== undefined) {
      validatedPreferences.publicProfile = TypeSafeConverter.toBoolean(
        rawPreferences.publicProfile
      );
    }

    // Update preferences with validated data
    const updatedUser = await UserService.updatePreferences(userId, validatedPreferences);

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