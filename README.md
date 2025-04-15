# Vibe IDE (Work in Progress)

A modern, AI-powered IDE built with Electron, React, and TypeScript. Currently under active development.

## 🚧 Project Status

This project is in early development. The following features are being implemented:

- [x] Terminal component with tabs
- [ ] Left/Right toggleable sidebars
- [ ] Editor with tabs and auto-referencing
- [ ] AI Chat integration
- [ ] File explorer
- [ ] Command palette
- [ ] Theme support

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone [your-repo-url]
cd vibe-ide

# Install dependencies
npm install

# Start development
npm run dev
```

### Current Structure

```
src/
  ├── components/
  │   └── Terminal.tsx    # Terminal component with tabs
  ├── styles/            # Global styles and themes
  └── utils/             # Utility functions
```

## 🛠️ Tech Stack

- Electron
- React
- TypeScript
- Styled Components
- Node.js

## 🎯 Immediate TODO

1. Set up basic Electron configuration
2. Install required dependencies:
   - react
   - react-dom
   - styled-components
   - electron
   - typescript
   - @types/react
   - @types/styled-components
3. Configure TypeScript
4. Implement basic layout components

## 🤝 Contributing

This project is under initial development. Feel free to watch the repository for updates.

## 📝 Notes

- Terminal component is the first feature being implemented
- Layout will be similar to VS Code/Cursor
- Focus on developer experience and AI integration

## 🔄 Temporary Setup (While Building)

While we're building the project, you can test the Terminal component:

```bash
# Install dependencies
npm install react react-dom styled-components typescript @types/react @types/styled-components

# Run TypeScript compiler
npx tsc --init  # If you haven't initialized TypeScript yet

# Start development server (once configured)
npm run dev
```

More documentation and setup instructions will be added as the project progresses. 