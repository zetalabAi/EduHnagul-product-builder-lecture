# Edu_Hangul MVP - Frontend Only

This is the frontend-only MVP for Edu_Hangul, a chat-first Korean learning application.

## Features

✅ **Responsive Design**
- Desktop: 3-column layout (Sessions | Chat | Settings)
- Mobile: Drawer-based navigation with top bar

✅ **Chat Interface**
- Real-time message input
- Mock streaming responses (word-by-word animation)
- Character-by-character typing simulation
- Empty states

✅ **Customizable Settings**
- Persona selector (same-sex friend, opposite-sex friend, boyfriend, girlfriend)
- Response style (Empathetic, Balanced, Blunt)
- Correction strength (Minimal, Strict)
- Translation buttons (mock functionality)

✅ **Mock Features**
- Session list with sample conversations
- AI responses that change based on persona
- Streaming simulation with 300ms delay
- Settings status pill showing current configuration

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

- Landing page: `/`
- Chat interface: `/app`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page (/)
│   ├── app/
│   │   └── page.tsx        # Chat interface (/app)
│   └── globals.css         # Global styles
├── components/
│   ├── Chat.tsx            # Chat timeline component
│   ├── Sidebar.tsx         # Session list (desktop)
│   ├── SettingsPanel.tsx   # Settings controls
│   ├── MobileHeader.tsx    # Mobile top bar
│   └── Drawer.tsx          # Mobile drawer wrapper
└── types/
    └── index.ts            # TypeScript type definitions
```

## What's Mocked

🔸 **No Backend** - All data is local state, no API calls
🔸 **No Firebase** - No authentication or database
🔸 **No AI** - Responses are randomly selected from predefined arrays
🔸 **Translation** - Shows alert with mock translation
🔸 **Streaming** - Simulated with setTimeout and word-by-word rendering

## Next Steps

When ready to add backend functionality:
1. Integrate Firebase (Auth, Firestore, Functions)
2. Connect to Gemini API for real AI responses
3. Implement actual streaming with SSE or WebSockets
4. Add real translation service
5. Persist chat history
6. Add user authentication

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes

- Designed for Chrome first, responsive across devices
- Clean, modern 2026 chat-first learning UI
- No external component libraries used (pure Tailwind)
- Fast and minimal bundle size
