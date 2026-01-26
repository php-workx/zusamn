import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';
import { OverflowMenu } from './OverflowMenu';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
);

describe('OverflowMenu', () => {
  it('renders trigger button', () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    const { container } = render(<OverflowMenu items={items} />, { wrapper });

    const trigger = container.querySelector('[aria-label="More options"]');
    expect(trigger).toBeTruthy();
  });

  it('menu is closed by default', () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    const { container } = render(<OverflowMenu items={items} />, { wrapper });

    // Menu items should not be visible
    expect(container.textContent).not.toContain('Edit');
  });

  it('opens menu when trigger is clicked', () => {
    const items = [
      { label: 'Edit', onPress: vi.fn() },
      { label: 'Delete', onPress: vi.fn(), destructive: true },
    ];
    const { container } = render(<OverflowMenu items={items} />, { wrapper });

    const trigger = container.querySelector('[aria-label="More options"]');
    if (!trigger) throw new Error('Expected trigger element');
    fireEvent.click(trigger);

    // Menu items should now be visible
    expect(container.textContent).toContain('Edit');
    expect(container.textContent).toContain('Delete');
  });

  it('calls item onPress and closes menu when item is clicked', () => {
    const onEdit = vi.fn();
    const items = [{ label: 'Edit', onPress: onEdit }];
    const { container } = render(
      <OverflowMenu items={items} />,
      { wrapper }
    );

    // Open menu
    const trigger = container.querySelector('[aria-label="More options"]');
    if (!trigger) throw new Error('Expected trigger element');
    fireEvent.click(trigger);

    // Click the menu item (use role="menuitem")
    const editItem = container.querySelector('[role="menuitem"]');
    if (!editItem) throw new Error('Expected menu item element');
    fireEvent.click(editItem);

    expect(onEdit).toHaveBeenCalledTimes(1);
    // Menu should be closed - no menuitem should exist
    expect(container.querySelector('[role="menuitem"]')).toBeNull();
  });

  it('toggles menu when trigger is clicked twice', () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    const { container } = render(<OverflowMenu items={items} />, { wrapper });

    const trigger = container.querySelector('[aria-label="More options"]');
    if (!trigger) throw new Error('Expected trigger element');

    // Open menu
    fireEvent.click(trigger);
    expect(container.textContent).toContain('Edit');

    // Close menu
    fireEvent.click(trigger);
    expect(container.textContent).not.toContain('Edit');
  });
});
