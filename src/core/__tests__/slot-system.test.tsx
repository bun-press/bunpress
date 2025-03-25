import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import React from 'react';
import { SlotProvider, Slot, SlotContent } from '../slot-system';
import { createRoot } from 'react-dom/client';

describe('Slot System', () => {
  // Set up a minimal DOM environment for testing
  let window: any;
  let document: any;
  let container: HTMLElement;
  let root: any;
  
  // Save original globals
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  
  beforeEach(() => {
    // Create a new window and document for each test
    window = new Window();
    document = window.document;
    
    // Set up the globals
    (globalThis as any).window = window;
    (globalThis as any).document = document;
    
    // Set up the container
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Create a root for React 18
    root = createRoot(container);
  });
  
  afterEach(() => {
    // Clean up React
    if (root) {
      root.unmount();
    }
    
    // Clean up container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Restore original globals
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  });
  
  // Helper to render and wait for the component
  async function render(element: React.ReactElement): Promise<void> {
    return new Promise<void>((resolve) => {
      root.render(element);
      // Allow the component to render with a longer timeout
      setTimeout(resolve, 100);
    });
  }
  
  test('renders empty slot with fallback', async () => {
    await render(
      <SlotProvider>
        <div data-testid="test-slot">
          <Slot name="test" fallback={<span>Fallback content</span>} />
        </div>
      </SlotProvider>
    );
    
    const slot = document.querySelector('[data-testid="test-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toContain('Fallback content');
  });
  
  test('renders empty slot with children', async () => {
    await render(
      <SlotProvider>
        <div data-testid="test-slot">
          <Slot name="test">
            <span>Child content</span>
          </Slot>
        </div>
      </SlotProvider>
    );
    
    const slot = document.querySelector('[data-testid="test-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toContain('Child content');
  });
  
  test('renders nothing when slot is empty with no fallback', async () => {
    await render(
      <SlotProvider>
        <div data-testid="empty-slot">
          <Slot name="empty" />
        </div>
      </SlotProvider>
    );
    
    const slot = document.querySelector('[data-testid="empty-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML.trim()).toBe('');
  });
  
  test('renders slot content from SlotContent', async () => {
    await render(
      <SlotProvider>
        <SlotContent slot="test">
          <div>Slot content</div>
        </SlotContent>
        <div data-testid="test-slot">
          <Slot name="test" />
        </div>
      </SlotProvider>
    );
    
    const slot = document.querySelector('[data-testid="test-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toContain('Slot content');
  });
  
  test('prefers slot content over children', async () => {
    await render(
      <SlotProvider>
        <SlotContent slot="test">
          <div>Slot content</div>
        </SlotContent>
        <div data-testid="test-slot">
          <Slot name="test">
            <span>Child content</span>
          </Slot>
        </div>
      </SlotProvider>
    );
    
    const slot = document.querySelector('[data-testid="test-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toContain('Slot content');
    expect(slot.innerHTML).not.toContain('Child content');
  });
  
  test('multiple slots work independently', async () => {
    await render(
      <SlotProvider>
        <SlotContent slot="slot1">
          <div>Slot 1 content</div>
        </SlotContent>
        <SlotContent slot="slot3">
          <div>Slot 3 content</div>
        </SlotContent>
        <div>
          <div data-testid="slot1"><Slot name="slot1" /></div>
          <div data-testid="slot2"><Slot name="slot2" fallback={<span>Fallback 2</span>} /></div>
          <div data-testid="slot3"><Slot name="slot3" /></div>
        </div>
      </SlotProvider>
    );
    
    const slot1 = document.querySelector('[data-testid="slot1"]');
    const slot2 = document.querySelector('[data-testid="slot2"]');
    const slot3 = document.querySelector('[data-testid="slot3"]');
    
    expect(slot1).not.toBeNull();
    expect(slot2).not.toBeNull();
    expect(slot3).not.toBeNull();
    
    expect(slot1.innerHTML).toContain('Slot 1 content');
    expect(slot2.innerHTML).toContain('Fallback 2');
    expect(slot3.innerHTML).toContain('Slot 3 content');
  });
  
  test('updates when slot content changes', async () => {
    const TestComponent = ({ showSecondContent = false }) => (
      <SlotProvider>
        {showSecondContent ? (
          <SlotContent slot="dynamic">
            <div>Updated content</div>
          </SlotContent>
        ) : (
          <SlotContent slot="dynamic">
            <div>Initial content</div>
          </SlotContent>
        )}
        <div data-testid="dynamic-slot">
          <Slot name="dynamic" />
        </div>
      </SlotProvider>
    );
    
    // Initial render
    await render(<TestComponent />);
    
    const slot = document.querySelector('[data-testid="dynamic-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.innerHTML).toContain('Initial content');
    
    // Update the component
    await render(<TestComponent showSecondContent={true} />);
    
    // Check that slot content was updated
    expect(slot.innerHTML).toContain('Updated content');
    expect(slot.innerHTML).not.toContain('Initial content');
  });
});
