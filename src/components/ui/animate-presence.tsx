import React, {createContext, useContext, useEffect, useRef} from 'react';

interface AnimatePresenceContextProps {
  handleExitComplete?: (node: HTMLElement) => void;
  registerChild: (id: string) => void;
  unregisterChild: (id: string) => void;
}

const AnimatePresenceContext = createContext<AnimatePresenceContextProps | null>(null);

// type PresenceChildStatus = 'entering' | 'present' | 'exiting';

interface PresenceChildProps {
  children: React.ReactNode;
  initial?: boolean;
  key?: string;
  mode?: 'sync' | 'wait';
  onExitComplete?: () => void;
}

export const AnimatePresence: React.FC<PresenceChildProps> = ({ 
  children, 
  // mode = 'sync',
  // initial = true,
  onExitComplete
}) => {
  const childrenToRender = React.Children.toArray(children);
  const childIds = useRef(new Set<string>());
  
  useEffect(() => {
    if (onExitComplete && childIds.current.size === 0) {
      onExitComplete();
    }
  }, [childIds, onExitComplete]);

  const registerChild = (id: string) => {
    childIds.current.add(id);
  };

  const unregisterChild = (id: string) => {
    childIds.current.delete(id);
    if (onExitComplete && childIds.current.size === 0) {
      onExitComplete();
    }
  };

  return (
    <AnimatePresenceContext.Provider
      value={{
        registerChild,
        unregisterChild,
      }}
    >
      {childrenToRender}
    </AnimatePresenceContext.Provider>
  );
};

export const useAnimatePresence = () => {
  const context = useContext(AnimatePresenceContext);
  if (!context) {
    throw new Error('useAnimatePresence must be used within an AnimatePresence component');
  }
  return context;
};