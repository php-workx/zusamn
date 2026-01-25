import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';
import { ListRow } from './ListRow';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
);

describe('ListRow', () => {
  it('renders item text', () => {
    const { getByText } = render(
      <ListRow text="Milk" checked={false} onPress={() => {}} />,
      { wrapper }
    );

    expect(getByText('Milk')).toBeTruthy();
  });

  it('shows checkmark when checked', () => {
    const { container } = render(
      <ListRow text="Milk" checked={true} onPress={() => {}} />,
      { wrapper }
    );

    // Verify checkmark is present in the rendered output
    expect(container.textContent).toContain('✓');
  });

  it('does not show checkmark when unchecked', () => {
    const { container } = render(
      <ListRow text="Milk" checked={false} onPress={() => {}} />,
      { wrapper }
    );

    // Verify checkmark is NOT present
    expect(container.textContent).not.toContain('✓');
  });

  it('calls onPress when clicked', () => {
    const onPress = vi.fn();
    const { container } = render(
      <ListRow text="Milk" checked={false} onPress={onPress} />,
      { wrapper }
    );

    // Find the clickable element and click it
    const clickable = container.querySelector('[role="checkbox"]');
    if (!clickable) throw new Error('Expected checkbox element');
    fireEvent.click(clickable);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes when unchecked', () => {
    const { container } = render(
      <ListRow text="Milk" checked={false} onPress={() => {}} />,
      { wrapper }
    );

    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect(checkbox?.getAttribute('aria-label')).toBe('Milk, unchecked');
  });

  it('has correct accessibility attributes when checked', () => {
    const { container } = render(
      <ListRow text="Milk" checked={true} onPress={() => {}} />,
      { wrapper }
    );

    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect(checkbox?.getAttribute('aria-label')).toBe('Milk, checked');
  });
});
