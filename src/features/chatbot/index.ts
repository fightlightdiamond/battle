/**
 * Chatbot Command System
 *
 * A conversational interface for interacting with the game application.
 * Users can type natural language commands in Vietnamese or English to perform
 * common actions like creating cards, starting battles, equipping items, and
 * checking status - without navigating through multiple UI screens.
 *
 * The system uses rule-based NLP techniques (fuzzy matching, pattern matching,
 * entity extraction) to understand user intent and execute commands against
 * existing game services.
 */

// Export all types
export * from "./types";

// Export components (excluding ChatMessage to avoid conflict with types)
export { Chatbot } from "./components/Chatbot";

// Services will be exported as they are implemented
// Note: InputNormalizer is exported from types, so we don't re-export from services
// export * from "./services/PatternMatcher";
// export * from "./services/EntityResolver";
// export * from "./services/CommandExecutor";
// export * from "./services/ResponseFormatter";
// export * from "./services/CommandParser";

// Stores will be exported as they are implemented
export * from "./store";
// export * from "./store/chatbotStore";

// Utils will be exported as they are implemented
// export * from "./utils/patternRegistry";
// export * from "./utils/entityCache";
export * from "./utils/messageTemplates";
