import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';
import { OverflowMenu } from './OverflowMenu';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
);

afterEach(() => {
  cleanup();
});

const getOverflowTrigger = () => {
  const trigger = screen.getAllByLabelText('More options')[0];
  if (!trigger) {
    throw new Error('OverflowMenu trigger not found');
  }
  return trigger;
};

describe('OverflowMenu', () => {
  it('renders trigger button', () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    render(<OverflowMenu items={items} />, { wrapper });

    expect(screen.getAllByLabelText('More options').length).toBeGreaterThan(0);
  });

  it('menu is closed by default', () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    render(<OverflowMenu items={items} />, { wrapper });

    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull();
  });

  it('opens menu when trigger is clicked', async () => {
    const items = [
      { label: 'Edit', onPress: vi.fn() },
      { label: 'Delete', onPress: vi.fn(), destructive: true },
    ];
    render(<OverflowMenu items={items} />, { wrapper });

    fireEvent.click(getOverflowTrigger());

    // Menu items should now be visible
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeTruthy();
    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeTruthy();
  });

  it('calls item onPress and closes menu when item is clicked', async () => {
    const onEdit = vi.fn();
    const items = [{ label: 'Edit', onPress: onEdit }];
    render(
      <OverflowMenu items={items} />,
      { wrapper }
    );

    // Open menu
    fireEvent.click(getOverflowTrigger());

    // Click the menu item (use role="menuitem")
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    // Menu should be closed - no menuitem should exist
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  it('toggles menu when trigger is clicked twice', async () => {
    const items = [{ label: 'Edit', onPress: vi.fn() }];
    render(<OverflowMenu items={items} />, { wrapper });

    // Open menu
    fireEvent.click(getOverflowTrigger());
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeTruthy();

    // Close menu
    fireEvent.click(getOverflowTrigger());
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull();
    });
  });
});
