import React, { createContext, useReducer, useEffect } from "react";

import useLocalStorage from "../hooks/useLocalStorage";
import { useClientOnly } from "../hooks/useClientOnly";

import type { PrintfulProduct } from "../types";

interface InitialState {
  items: PrintfulProduct[];
}

interface WishlistProviderState {
  items: PrintfulProduct[];
  isSaved: (id: PrintfulProduct["id"]) => boolean;
  hasItems: boolean;
}

const ADD_PRODUCT = "ADD_PRODUCT";
const REMOVE_PRODUCT = "REMOVE_PRODUCT";

type Actions =
  | { type: typeof ADD_PRODUCT; payload: PrintfulProduct }
  | { type: typeof REMOVE_PRODUCT; payload: PrintfulProduct["id"] };

export const WishlistStateContext = createContext<WishlistProviderState | null>(null);
export const WishlistDispatchContext = createContext<{
  addItem: (item: PrintfulProduct) => void;
  removeItem: (id: PrintfulProduct["id"]) => void;
} | null>(null);

const initialState: InitialState = {
  items: [],
};

const reducer = (state: InitialState, { type, payload }: Actions): InitialState => {
  switch (type) {
    case ADD_PRODUCT:
      return { ...state, items: [...state.items, payload] };
    case REMOVE_PRODUCT:
      return {
        ...state,
        items: state.items.filter((i: PrintfulProduct) => i.id !== payload),
      };
    default:
      throw new Error(`Invalid action: ${type}`);
  }
};

export const WishlistProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [savedWishlist, saveWishlist] = useLocalStorage(
    "items-wishlist",
    JSON.stringify(initialState)
  );
  
  // Safely parse the saved wishlist
  const getInitialState = () => {
    try {
      return JSON.parse(savedWishlist);
    } catch (error) {
      console.warn('Failed to parse saved wishlist, using initial state:', error);
      return initialState;
    }
  };
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const isClient = useClientOnly();

  // Load initial state from localStorage after mount
  useEffect(() => {
    if (isClient) {
      const savedState = getInitialState();
      if (savedState.items.length > 0) {
        // Reset to saved state
        savedState.items.forEach((item: any) => {
          dispatch({ type: ADD_PRODUCT, payload: item });
        });
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      saveWishlist(JSON.stringify(state));
    }
  }, [state, saveWishlist, isClient]);

  const addItem = (item: PrintfulProduct) => {
    if (!item.id) return;

    const existing = state.items.find((i: PrintfulProduct) => i.id === item.id);

    if (existing) return dispatch({ type: REMOVE_PRODUCT, payload: item.id });

    dispatch({ type: ADD_PRODUCT, payload: item });
  };

  const removeItem = (id: PrintfulProduct["id"]) => {
    if (!id) return;

    dispatch({ type: REMOVE_PRODUCT, payload: id });
  };

  const isSaved = (id: PrintfulProduct["id"]) =>
    state.items.some((i: PrintfulProduct) => i.id === id);

  const hasItems = state.items.length > 0;

  return (
    <WishlistDispatchContext.Provider value={{ addItem, removeItem }}>
      <WishlistStateContext.Provider value={{ items: state.items, isSaved, hasItems }}>
        {children}
      </WishlistStateContext.Provider>
    </WishlistDispatchContext.Provider>
  );
};
