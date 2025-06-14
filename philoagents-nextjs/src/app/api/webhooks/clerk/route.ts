import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/mongodb/userService";

export async function POST(req: Request) {
  // For simplicity, we'll do basic webhook handling without signature verification
  // In production, you'd want to verify the webhook signature
  
  try {
    const payload = await req.json();
    const eventType = payload.type;
    
    console.log('Received Clerk webhook:', eventType);

    switch (eventType) {
      case "user.created":
      case "user.updated":
        await UserService.upsertFromClerk(payload.data);
        break;
      case "user.deleted":
        await UserService.deleteUser(payload.data.id);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}