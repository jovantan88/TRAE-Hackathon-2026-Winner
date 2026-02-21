"use client";

import { useReducer, useCallback, useMemo } from "react";
import type { ChatState, ChatAction, ChatMessage } from "@/types/chatbot";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "UPDATE_LAST_MESSAGE":
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      return {
        ...state,
        messages: state.messages.map((msg, i) =>
          i === lastIndex ? { ...msg, ...action.payload } : msg
        ),
      };
    case "CLEAR_CHAT":
      return initialState;
    default:
      return state;
  }
}

export function useChatbot() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: newMessage });
  }, []);

  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    dispatch({ type: "UPDATE_LAST_MESSAGE", payload: updates });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
  }, []);

  const messages = useMemo(() => state.messages, [state.messages]);
  const isLoading = useMemo(() => state.isLoading, [state.isLoading]);
  const error = useMemo(() => state.error, [state.error]);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    updateLastMessage,
    setLoading,
    setError,
    clearChat,
  };
}
