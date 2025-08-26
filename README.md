<div align="center">
  <h1>PhiloAgents Course</h1>
  <h3>Learn how to build an AI-powered game simulation engine to impersonate popular philosophers.</h3>
  
</div>

</br>

<p align="center">
    <img src="static/diagrams/system_architecture.png" alt="Architecture" width="600">
</p>



## 🏗️ Project Structure



```bash
.
├── philoagents-api/         # Backend API containing the PhiloAgents simulation engine (Python)
├── philoagents-ui/          # Frontend UI for the single-player game (Node)
└── philoagents-multiplayer/ # Multiplayer game server using Colyseus framework (Node)
```

The course will focus primarily on the `philoagents-api` application that contains all the agent simulation logic. The `philoagents-ui` application is used to play the single-player game, while the `philoagents-multiplayer` server enables real-time multiplayer interactions between players and philosophers.

## 👔 Dataset

To impersonate our philosopher agents with real-world knowledge, we will populate their long-term memory with data from:
- Wikipedia
- The Stanford Encyclopedia of Philosophy

You don't have to download anything explicitly. While populating the long-term memory, the `philoagents-api` application will download the data from the internet automatically.

## 🚀 Getting Started

Find detailed setup and usage instructions in the [INSTALL_AND_USAGE.md](INSTALL_AND_USAGE.md) file.

**Pro tip:** Read the accompanying articles first for a better understanding of the system you'll build.

## 🌍 Recent Updates: Full Internationalization

The project now includes **complete internationalization (i18n) support** in the Next.js frontend:

### ✨ New Features Added
- **Multi-language support**: English (default) and Spanish
- **Automatic locale detection** from browser preferences
- **URL-based routing**: `/en/dashboard` and `/es/dashboard`
- **Type-safe translation system** with full TypeScript support
- **Comprehensive coverage**: All UI elements, forms, validation messages, and dynamic content

### 🎯 Localized Components
- **Navigation & Menus**: All interface elements translated
- **Practice Module**: Image recognition with localized questions and feedback
- **Settings & Profile**: User preferences with language-aware forms
- **Discussion Forums**: Multi-way conversation interface
- **Game Integration**: Phaser.js game with localized loading states
- **Error Handling**: API errors and validation messages in user's language

### 🔧 Technical Implementation
- Smart middleware for locale detection and routing
- Dictionary-based translation system (`en.json`, `es.json`)
- Parameter interpolation for dynamic content
- SEO-friendly localized URLs
- Fallback mechanisms for unsupported locales

## 💡 Questions and Troubleshooting

Have questions or running into issues? We're here to help!

Open a [GitHub issue](https://github.com/neural-maze/philoagents-course/issues) for:
- Questions about the course material
- Technical troubleshooting
- Clarification on concepts

## 🥂 Contributing

As an open-source course, we may not be able to fix all the bugs that arise.

If you find any bugs and know how to fix them, support future readers by contributing to this course with your bug fix.

You can always contribute by:
- Forking the repository
- Fixing the bug
- Creating a pull request

📍 [For more details, see the contributing guide.](CONTRIBUTING.md)
