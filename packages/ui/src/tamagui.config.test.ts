import { describe, expect, it } from 'vitest';
import { tamaguiConfig } from './tamagui.config';

describe('tamagui config', () => {
  it('matches the MVP typography scale', () => {
    const sizes = tamaguiConfig.fonts.body.size;

    expect(sizes['1']).toBe(13);
    expect(sizes['2']).toBe(17);
    expect(sizes['3']).toBe(20);
  });

  it('matches the MVP spacing scale', () => {
    const space = tamaguiConfig.tokens.space;

    expect(space['2'].val).toBe(8);
    expect(space['3'].val).toBe(12);
    expect(space['4'].val).toBe(16);
  });

  it('matches MVP radii', () => {
    const radius = tamaguiConfig.tokens.radius;

    expect(radius['1'].val).toBe(12);
    expect(radius['2'].val).toBe(16);
  });

  it('defines semantic theme colors', () => {
    const light = tamaguiConfig.themes.light;

    expect(light.bg.val).toBe('$white');
    expect(light.surface.val).toBe('$gray1');
    expect(light.text.val).toBe('$black');
    expect(light.textMuted.val).toBe('$gray6');
    expect(light.separator.val).toBe('$gray2');
    expect(light.accent.val).toBe('$blue');
    expect(light.danger.val).toBe('$red');
  });
});
