# Future Enhancement: AI Chatbot for Debt Breakdown

**Goal**: Add a "✨ Ask AI to Explain" feature to the Debt Breakdown tab. This will use an AI (like Google Gemini) to analyze the current live debt breakdown and explain it in plain, conversational English, clarifying why certain people owe others.

## Prerequisites
- **API Key**: An AI API key is required. The Google Gemini API is recommended due to its generous free tier. You will need to obtain a key from Google AI Studio and add it to the backend `.env` file as `GEMINI_API_KEY`.

## Design Considerations
- **Conversational vs One-Off**: This is planned as an interactive chat modal. The AI will provide an initial explanation when opened, but users will also have a text input box to ask follow-up questions (e.g., "Wait, why does Afril owe Joel exactly?").
- **UI Placement**: A Floating Action Button (FAB) or a prominent button at the top of the Debt Breakdown page.

---

## Implementation Steps

### 1. Backend Services & Routes

**Install SDK**:
Run `npm install @google/generative-ai` in the backend directory.

**New Service**: `backend/src/services/aiService.js`
- Initialize the Google Gemini SDK using `process.env.GEMINI_API_KEY`.
- Create a function `generateBreakdownExplanation(breakdownData, userMessage, chatHistory)` that sends the current debt breakdown JSON as a system prompt to the AI and requests a human-readable explanation.

**New Controller**: `backend/src/controllers/aiController.js`
- Implement `explainBreakdown` controller. It will call `breakdownService.getSimplificationBreakdown()` internally, grab the current state, and pass it to `aiService.js`.

**New Route**: `backend/src/api/v1/routes/ai.js`
- Define `POST /api/v1/ai/explain` route.

**Mount Route**: `backend/src/api/v1/index.js`
- Mount the new `/ai` routes.

---

### 2. Frontend Components

**New Component**: `frontend/src/components/AIChatModal.jsx`
- Create a chat interface modal with a message history window and a text input field for follow-up questions.
- It will automatically send an initial request to the backend when opened to fetch the base explanation.

**Modify Page**: `frontend/src/pages/SimplificationBreakdown.jsx`
- Import and render the `AIChatModal`.
- Add a "✨ Ask AI to Explain" button to trigger the modal.

**Modify API Library**: `frontend/src/lib/api.js`
- Add a `chatWithAI(history, newMessage)` function to call the new backend endpoint.


# Goal: Implement Progressive Web App (PWA) Support

Progressive Web Apps allow users to install the website directly to their mobile device's home screen. It feels and acts like a native iOS/Android application, complete with a launch screen, offline caching, and no browser address bar.

We will achieve this by leveraging `vite-plugin-pwa`, which automatically generates the necessary Service Workers and Web App Manifests.

## User Review Required

> [!IMPORTANT]
> **App Icons:** I will generate standard placeholder icons (192x192 and 512x512) for the PWA using a simple colored square with "PG" text. If you have a custom logo you want to use, you can replace these files in the `frontend/public` directory later.

## Proposed Changes

### Frontend Infrastructure

#### [MODIFY] `frontend/package.json`
- Run `npm install -D vite-plugin-pwa` to add the required Vite plugin for generating Service Workers and the `manifest.json`.

#### [MODIFY] `frontend/vite.config.js`
- Import and configure `VitePWA`.
- Configure the App Manifest:
  - `name`: "PG Expense Tracker"
  - `short_name`: "PG Expense"
  - `theme_color`: `#292524` (Our deep primary color for the status bar)
  - `background_color`: `#FBF9F4` (Our pastel cream for the splash screen)
  - `display`: `standalone` (removes the browser URL bar)
  - Point to the icon assets.

#### [MODIFY] `frontend/index.html`
- Add `<meta name="theme-color" content="#292524">` for mobile browser toolbars.
- Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` for iOS support.

### New Assets

#### [NEW] `frontend/public/pwa-192x192.png`
#### [NEW] `frontend/public/pwa-512x512.png`
#### [NEW] `frontend/public/apple-touch-icon.png`
- I will run a script to generate basic image files for these icons so that the PWA registers successfully on all devices.

## Verification Plan

### Automated Build
- Run `npm run build` in the frontend directory to verify that the `sw.js` (Service Worker) and `manifest.webmanifest` are correctly generated without errors.

### Manual Verification
- Start the dev server.
- I will ask you to open the site in Chrome (Desktop or Mobile) and check if the "Install App" icon appears in the address bar.

