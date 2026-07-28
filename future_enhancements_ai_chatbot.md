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
