export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard'
}

export const clerkAppearance = {
  elements: {
    formButtonPrimary: 
      "bg-primary hover:bg-primary/90 text-primary-foreground",
    formFieldInput: 
      "border-input bg-background text-foreground",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: 
      "border-input bg-background text-foreground hover:bg-accent",
    formFieldLabel: "text-foreground",
    dividerText: "text-muted-foreground",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/90",
  }
}