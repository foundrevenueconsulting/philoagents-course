# PhiloAgents Next.js Frontend

A production-ready Next.js application for the PhiloAgents AI philosophy conversation platform, featuring enterprise-grade type safety, Clerk authentication, and real-time multiplayer capabilities.

## 🏗️ Architecture Overview

This Next.js application serves as the modern frontend for PhiloAgents, integrating:
- **Phaser.js game engine** for interactive philosophical conversations
- **Clerk authentication** for user management
- **Type-safe API integration** with the Python FastAPI backend
- **Real-time multiplayer** via Colyseus WebSocket server
- **Enterprise-grade TypeScript** with comprehensive type safety
- **🌍 Full internationalization (i18n)** with English and Spanish support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Running PhiloAgents API (see `../philoagents-api/`)
- Running Colyseus multiplayer server (see `../philoagents-multiplayer/`)

### Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local

# Configure required environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:2567
MONGO_URI=mongodb://localhost:27017/philoagents
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🌍 Internationalization (i18n)

The application features **complete internationalization** with support for multiple languages:

### Supported Languages
- **English (en)** - Default language
- **Spanish (es)** - Full translation coverage

### Key Features

#### **Dynamic Locale Detection**
- Automatic browser language detection via `Accept-Language` header
- URL-based locale routing: `/en/dashboard`, `/es/dashboard`
- Fallback to English for unsupported locales

#### **Comprehensive Translation Coverage**
- **Navigation & UI Elements**: All menus, buttons, and interface text
- **Form Labels & Validation**: Error messages, input placeholders, validation text
- **Dynamic Content**: Date formatting, number formatting, pluralization
- **Error Messages**: API errors, validation messages, system notifications
- **Game Integration**: Loading messages and game interface text

#### **Localized Page Structure**
All main application pages support localization:
```
/[lang]/
├── dashboard/         # User dashboard
├── discussions/       # Multi-way conversations
├── practice/          # Image recognition practice
├── game/              # Phaser.js game interface
├── profile/           # User profile and settings
└── (auth)/           # Authentication pages
```

#### **Type-Safe Translation System**
```typescript
// Dictionary structure with full type safety
interface Dictionary {
  nav: {
    dashboard: string;
    discussions: string;
    practice: string;
    // ... all navigation items
  };
  practice: {
    total_attempts: string;
    accuracy: string;
    submit_answer: string;
    // ... all practice-related translations
  };
  // ... comprehensive coverage
}

// Usage in components
const { dict } = await getDictionary('es');
<Button>{dict.practice.submit_answer}</Button> // "Enviar Respuesta"
```

#### **Advanced Localization Features**
- **Parameter Interpolation**: `"Total: {total} • Accuracy: {accuracy}%"`
- **Pluralization Support**: Dynamic text based on quantity
- **Date/Time Localization**: Locale-aware formatting
- **Error Message Localization**: API errors translated based on user locale
- **SEO-Friendly URLs**: Language-specific routes for better search indexing

### Implementation Details

#### **Middleware Integration**
```typescript
// Automatic locale detection and routing
const locale = getLocale(request); // Browser language detection
const newUrl = new URL(`/${locale}${pathname}`, request.url);
return NextResponse.redirect(newUrl);
```

#### **Component Localization Pattern**
```typescript
// All pages receive dictionary and locale
interface PageProps {
  params: { lang: Locale };
}

export default async function Page({ params: { lang } }: PageProps) {
  const dict = await getDictionary(lang);
  return <LocalizedComponent dict={dict} />;
}
```

#### **Translation Files**
- `src/lib/dictionaries/en.json` - English translations
- `src/lib/dictionaries/es.json` - Spanish translations
- Type-safe dictionary loading via `getDictionary(locale)`

### Recent Localization Enhancements

The latest implementation includes:
✅ **Complete UI Translation** - All interface elements localized  
✅ **Form Validation Messages** - Error messages in user's language  
✅ **Dynamic Content Formatting** - Dates, times, and numbers  
✅ **Practice Module** - Full i18n support for image recognition  
✅ **Settings & Profile** - User preferences with localized labels  
✅ **Game Integration** - Loading states and game UI text  
✅ **Discussion Forums** - Multi-way conversation interface

## 🛡️ Type Safety Architecture

This application implements **enterprise-grade type safety** with zero tolerance for `any` types or unsafe casting.

### Core Type System

#### **1. Structured Type Definitions**

```typescript
// src/types/api.ts - Comprehensive API interfaces
interface ConversationHistoryItem {
  id: string;
  philosopher_id: string;
  philosopher_name: string;
  message: string;
  response: string;
  timestamp: string;
  user_id?: string;
}

interface UserPreferences {
  favoritePhilosopher?: string;
  gameVolume?: number;
  conversationSpeed?: number;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  shareConversations?: boolean;
  publicProfile?: boolean;
}
```

#### **2. Type-Safe Conversion Utilities**

```typescript
// src/utils/TypeSafeConverters.ts - Runtime validation with type safety
import { TypeSafeConverter } from '@/utils/TypeSafeConverters';

// Safe string conversion with fallback
const name = TypeSafeConverter.toString(data.name, 'Anonymous');

// Safe number conversion with validation
const volume = TypeSafeConverter.toNumber(data.volume, 50);

// Validated array conversion
const conversations = TypeSafeConverter.toTypedArray(
  rawData, 
  TypeSafeConverter.toConversationHistoryItem,
  'conversation history'
);
```

#### **3. API Response Handling**

```typescript
// Type-safe API responses with runtime validation
class ApiService {
  async getConversationHistory(userId: string): Promise<ConversationHistoryItem[]> {
    const rawData = await this.request<unknown[]>('/conversations', 'GET');
    return TypeSafeConverter.toTypedArray(
      rawData, 
      TypeSafeConverter.toConversationHistoryItem,
      'conversation history'
    );
  }
}
```

#### **4. Error Handling with Context**

```typescript
// Type-safe error reporting
import { WindowUtils, TypedError } from '@/utils/TypeSafeConverters';

try {
  // API operation
} catch (error) {
  WindowUtils.captureException(error, {
    tags: { service: 'ApiService', method: 'sendMessage' },
    extra: { userId, philosopherId }
  });
  throw new TypedError('Failed to send message', 'API_ERROR', 500);
}
```

### Type Safety Features

✅ **Zero `any` types** - All data is properly typed  
✅ **Runtime validation** - External data is validated before use  
✅ **Type guards** - Safe type checking with runtime guarantees  
✅ **Branded types** - Prevent ID confusion with branded string types  
✅ **Strict null safety** - Comprehensive null/undefined handling  
✅ **Form validation** - Type-safe form data processing  
✅ **API error handling** - Structured error responses with context  

## 🎮 Game Integration

### Phaser.js Integration

The application embeds a sophisticated Phaser.js game for philosophical conversations:

```typescript
// src/components/game/PhaserGame.tsx
import { GameSceneData, PhaserUtils } from '@/types/phaser';

export default function PhaserGame() {
  const { user } = useUser();

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      // Type-safe game configuration
      callbacks: {
        preBoot: (game) => {
          // Pass typed user context to game
          game.registry.set('userId', user?.id || 'anonymous');
          game.registry.set('userName', user?.fullName || 'Anonymous Player');
          game.registry.set('isAuthenticated', !!user);
        }
      }
    };
  }, [user]);
}
```

### Multiplayer Integration

Real-time multiplayer via Colyseus with type-safe state management:

```typescript
// Type-safe multiplayer service
import { PlayerData, GameEvent } from '@/types/api';

class MultiplayerService {
  async joinRoom(options: {
    playerName: string;
    characterType: string;
    userId?: string;
  }): Promise<boolean> {
    // Type-safe room joining with validation
  }

  sendPlayerMovement(x: number, y: number, direction: string, isMoving: boolean): void {
    // Type-safe movement data
  }
}
```

## 🔐 Authentication & User Management

### Clerk Integration

Secure authentication with comprehensive user management:

```typescript
// Type-safe user context throughout the application
const { user, isLoaded } = useUser();

// API routes with proper authentication
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Type-safe user operations
}
```

### User Preferences

Type-safe user preference management:

```typescript
// Type-safe preference updates with validation
const updatePreferences = async (preferences: Partial<UserPreferences>) => {
  const validatedPreferences: Partial<UserPreferences> = {};
  
  if (preferences.gameVolume !== undefined) {
    const volume = TypeSafeConverter.toNumber(preferences.gameVolume);
    if (volume >= 0 && volume <= 100) {
      validatedPreferences.gameVolume = volume;
    }
  }
  
  await apiService.updatePreferences(userId, validatedPreferences);
};
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── api/                      # API routes
│   ├── dashboard/                # User dashboard
│   └── game/                     # Game interface
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── game/                     # Game-related components
│   └── ui/                       # UI primitives (shadcn/ui)
├── lib/                          # Core utilities
│   ├── phaser/                   # Phaser game files
│   │   ├── scenes/               # Game scenes
│   │   └── classes/              # Game classes
│   └── services/                 # API and external services
├── types/                        # **Type Definitions**
│   ├── api.ts                    # API interfaces
│   ├── phaser.ts                 # Game type definitions
│   └── globals.d.ts              # Global type extensions
├── utils/                        # **Type-Safe Utilities**
│   └── TypeSafeConverters.ts     # Conversion & validation utilities
└── middleware.ts                 # Route protection
```

## 🔧 Development Guidelines

### Type Safety Best Practices

1. **Never use `any`** - Always create proper interfaces
2. **Validate external data** - Use `TypeSafeConverter` for all external inputs
3. **Handle errors gracefully** - Use `TypedError` with context
4. **Use type guards** - Validate data structure before use
5. **Leverage branded types** - Prevent ID confusion

### Code Examples

#### ✅ **Correct: Type-Safe API Call**

```typescript
// Good: Proper type safety with validation
const conversations = await apiService.getConversationHistory(userId);
conversations.forEach(conv => {
  // conv is properly typed as ConversationHistoryItem
  console.log(conv.philosopher_name, conv.message);
});
```

#### ❌ **Incorrect: Unsafe Type Casting**

```typescript
// Bad: Unsafe casting without validation
const data = response as any;
const conversations = data.map((item: any) => ({
  id: item.id || 'unknown',
  // Risk of runtime errors
}));
```

### Form Validation

```typescript
// Type-safe form validation
import { FormValidator } from '@/utils/TypeSafeConverters';

const validateProfileForm = (data: unknown): ProfileFormData => {
  return {
    firstName: FormValidator.validateRequired(data.firstName, 'First name'),
    lastName: FormValidator.validateRequired(data.lastName, 'Last name'),
    email: FormValidator.validateEmail(data.email) ? String(data.email) : 
           throw new TypedError('Invalid email format', 'VALIDATION_ERROR')
  };
};
```

## 🚀 Deployment

### Environment Variables

Required for production:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# API Endpoints
NEXT_PUBLIC_API_URL=https://api.philoagents.com
NEXT_PUBLIC_MULTIPLAYER_URL=wss://multiplayer.philoagents.com

# Database
MONGO_URI=mongodb+srv://...

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-...
COMET_API_KEY=...
```

### Build Process

```bash
# Type checking and linting
npm run build

# Expected output: Zero TypeScript errors, zero ESLint warnings
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (13/13)
```

## 🧪 Testing

### Type Safety Validation

The build process validates:
- All TypeScript interfaces are properly defined
- No `any` types or unsafe casting
- All external data is validated before use
- Error handling includes proper context
- API responses match expected interfaces

### Manual Testing

1. **Authentication Flow**: Sign up, sign in, user preferences
2. **Game Integration**: Phaser game loads with user context
3. **Multiplayer**: Real-time player interactions
4. **API Integration**: Conversation history, philosopher interactions
5. **Error Handling**: Network failures, invalid data responses

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Phaser.js Game Development](https://phaser.io/learn)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Colyseus Multiplayer](https://docs.colyseus.io/)

## 🤝 Contributing

1. Follow the established type safety patterns
2. Add proper interfaces for all new data structures
3. Use `TypeSafeConverter` utilities for external data
4. Include error handling with `TypedError`
5. Ensure zero TypeScript/ESLint errors before committing

## 📄 License

This project is part of the PhiloAgents course material.