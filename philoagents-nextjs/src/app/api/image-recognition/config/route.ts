import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return the temperament recognition configuration
    const config = {
      type: "temperaments",
      title: "Temperament Recognition Practice",
      description: "Practice identifying classical temperaments from facial expressions and body language",
      options: [
        {
          id: "choleric",
          label: "Choleric",
          description: "Ambitious, leader-like, energetic, passionate"
        },
        {
          id: "phlegmatic", 
          label: "Phlegmatic",
          description: "Relaxed, peaceful, quiet, easy-going"
        },
        {
          id: "sanguine",
          label: "Sanguine", 
          description: "Sociable, enthusiastic, active, spontaneous"
        },
        {
          id: "melancholic",
          label: "Melancholic",
          description: "Thoughtful, reserved, perfectionist, moody"
        }
      ],
      categories: [],
      difficulties: []
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}