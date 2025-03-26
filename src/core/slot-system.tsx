import React from 'react';

interface SlotContextValue {
  slots: Map<string, React.ReactNode>;
  registerSlot: (name: string, content: React.ReactNode) => void;
}

const SlotContext = React.createContext<SlotContextValue>({
  slots: new Map(),
  registerSlot: () => {},
});

export function SlotProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = React.useState<Map<string, React.ReactNode>>(new Map());

  const registerSlot = React.useCallback((name: string, content: React.ReactNode) => {
    setSlots(prev => {
      const next = new Map(prev);
      next.set(name, content);
      return next;
    });
  }, []);

  return <SlotContext.Provider value={{ slots, registerSlot }}>{children}</SlotContext.Provider>;
}

interface SlotProps {
  name: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Slot({ name, children, fallback }: SlotProps) {
  const { slots } = React.useContext(SlotContext);
  const content = slots.get(name);

  if (content) {
    return <>{content}</>;
  }

  if (children) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

interface SlotContentProps {
  slot: string;
  children: React.ReactNode;
}

export function SlotContent({ slot, children }: SlotContentProps) {
  const { registerSlot } = React.useContext(SlotContext);

  React.useEffect(() => {
    registerSlot(slot, children);
    return () => registerSlot(slot, null);
  }, [slot, children, registerSlot]);

  return null;
}

/**
 * Create a slot system for managing content slots
 */
export function createSlotSystem() {
  const slots: Record<string, any> = {};

  return {
    /**
     * Register a slot with content
     */
    registerSlot: (name: string, content: any) => {
      slots[name] = content;
    },

    /**
     * Get content for a slot
     */
    getSlotContent: (name: string, fallback?: any) => {
      return slots[name] || fallback;
    },

    /**
     * Render a page with slots
     */
    renderWithSlots: (template: string, slotData: Record<string, any>) => {
      // Fill slots in template
      let result = template;

      for (const [slotName, content] of Object.entries(slotData)) {
        const slotPlaceholder = `{{slot:${slotName}}}`;
        result = result.replace(
          new RegExp(slotPlaceholder, 'g'),
          typeof content === 'string' ? content : JSON.stringify(content)
        );
      }

      return result;
    },

    /**
     * Clear all registered slots
     */
    clearSlots: () => {
      Object.keys(slots).forEach(key => {
        delete slots[key];
      });
    },
  };
}
