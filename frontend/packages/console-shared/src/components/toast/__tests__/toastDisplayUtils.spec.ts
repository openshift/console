import { AlertVariant } from '@patternfly/react-core';
import type { ToastOptions } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getOverflowCount, getVisibleToasts, normalizeToastOptions } from '../toastDisplayUtils';

const toast = (id: string, options: Partial<ToastOptions> = {}) =>
  ({
    id,
    title: id,
    variant: AlertVariant.info,
    content: id,
    ...options,
  } as ToastOptions & { id: string });

describe('toastDisplayUtils', () => {
  it('should cap only toasts that participate in overflow', () => {
    const toasts = [
      toast('skip-1', { skipOverflow: true }),
      toast('capped-1'),
      toast('capped-2'),
      toast('capped-3'),
    ];

    expect(getVisibleToasts(toasts, 2).map(({ id }) => id)).toEqual([
      'skip-1',
      'capped-1',
      'capped-2',
    ]);
    expect(getOverflowCount(toasts, 2)).toBe(1);
  });

  it('should not show overflow when only skipOverflow toasts exceed the cap', () => {
    const toasts = [
      toast('skip-1', { skipOverflow: true }),
      toast('skip-2', { skipOverflow: true }),
    ];

    expect(getVisibleToasts(toasts, 1)).toHaveLength(2);
    expect(getOverflowCount(toasts, 1)).toBe(0);
  });

  it('should force skipOverflow when persistInDrawer is false', () => {
    const normalized = normalizeToastOptions({
      title: 'ephemeral',
      variant: AlertVariant.info,
      content: 'toast only',
      persistInDrawer: false,
      skipOverflow: false,
    });

    expect(normalized.skipOverflow).toBe(true);
  });

  it('should treat negative maxDisplayed as zero for overflow calculations', () => {
    const toasts = [toast('capped-1'), toast('capped-2'), toast('capped-3')];

    expect(getVisibleToasts(toasts, -1)).toHaveLength(0);
    expect(getOverflowCount(toasts, -1)).toBe(3);
  });

  it('should show all normalized ephemeral toasts without overflow', () => {
    const toasts = [
      normalizeToastOptions(toast('ephemeral-1', { persistInDrawer: false, skipOverflow: false })),
      normalizeToastOptions(toast('ephemeral-2', { persistInDrawer: false, skipOverflow: false })),
      normalizeToastOptions(toast('ephemeral-3', { persistInDrawer: false, skipOverflow: false })),
      normalizeToastOptions(toast('ephemeral-4', { persistInDrawer: false, skipOverflow: false })),
    ];

    expect(getVisibleToasts(toasts, 3)).toHaveLength(4);
    expect(getOverflowCount(toasts, 3)).toBe(0);
  });
});
