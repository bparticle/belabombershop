import { useReducer, useEffect } from "react";

import { hasSnipcart } from "../lib/has-snipcart";

const initialState = {
  cart: {
    items: {
      count: 0,
      items: [],
    },
  },
};

interface SnipcartState {
  cart: {
    items: {
      count: number;
      items: any[];
    };
  };
}

interface SnipcartAction {
  type: "SET";
  payload: any;
}

const reducer = (state: SnipcartState, action: SnipcartAction): SnipcartState => {
  switch (action.type) {
    case "SET":
      return {
        ...state,
        ...action.payload,
      };
    default:
      throw new Error(`No such action ${action.type}`);
  }
};

const useSnipcartCount = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // Wait for Snipcart to be available
    const checkSnipcart = () => {
      if (hasSnipcart() && window.Snipcart.store) {
        try {
          const unsubscribe = window.Snipcart.store.subscribe(() => {
            const itemsCount = window.Snipcart.store?.getState();
            dispatch({ type: "SET", payload: itemsCount });
          });

          return unsubscribe;
        } catch (error) {
          console.warn('Snipcart store not ready yet:', error);
          return null;
        }
      }
      return null;
    };

    // Try immediately
    let unsubscribe = checkSnipcart();
    
    // If not ready, try again after a short delay
    if (!unsubscribe) {
      const timer = setTimeout(() => {
        unsubscribe = checkSnipcart();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    return unsubscribe;
  }, []);

  return state;
};

export default useSnipcartCount;
