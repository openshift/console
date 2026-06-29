import { AlertVariant } from '@patternfly/react-core';
import type { ToastOptions } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getOverflowCount, getVisibleToasts, normalizeToastOptions } from '../toastDisplayUtils';
import type { ToastRenderOptions } from '../types';
import { DEFAULT_MAX_DISPLAYED_TOASTS } from '../types';

const toast = (id: string, options: Partial<ToastOptions> = {}): ToastRenderOptions => ({
  id,
  title: id,
  variant: AlertVariant.info,
  content: id,
  ...options,
});

describe('toastDisplayUtils', () => {
  it('should cap only toasts that participate in overflow', () => {
    const toasts = [
      toast('skip-1', { skipOverflow: true }),
      toast('capped-1', { skipOverflow: false }),
      toast('capped-2', { skipOverflow: false }),
      toast('capped-3', { skipOverflow: false }),
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

  it('should default skipOverflow to false when persistInDrawer is true', () => {
    const normalized = normalizeToastOptions({
      title: 'drawer toast',
      variant: AlertVariant.info,
      content: 'persisted',
      persistInDrawer: true,
    } as ToastOptions);

    expect(normalized.skipOverflow).toBe(false);
  });

  it('should respect explicit skipOverflow true when persistInDrawer is true', () => {
    const normalized = normalizeToastOptions({
      title: 'always visible drawer toast',
      variant: AlertVariant.info,
      content: 'pinned',
      persistInDrawer: true,
      skipOverflow: true,
    });

    expect(normalized.skipOverflow).toBe(true);
  });

  it('should not alter skipOverflow when persistInDrawer is not true', () => {
    const withDefault = normalizeToastOptions({
      title: 'default',
      variant: AlertVariant.info,
      content: 'default toast',
    } as ToastOptions);
    expect(withDefault.skipOverflow).toBeUndefined();

    const withExplicitFalse = normalizeToastOptions({
      title: 'explicit',
      variant: AlertVariant.info,
      content: 'explicit false',
      persistInDrawer: false,
      skipOverflow: false,
    });
    expect(withExplicitFalse.skipOverflow).toBe(false);
  });

  it('should treat negative maxDisplayed as zero for overflow calculations', () => {
    const toasts = [
      toast('capped-1', { skipOverflow: false }),
      toast('capped-2', { skipOverflow: false }),
      toast('capped-3', { skipOverflow: false }),
    ];

    expect(getVisibleToasts(toasts, -1)).toHaveLength(0);
    expect(getOverflowCount(toasts, -1)).toBe(3);
  });

  it('should cap drawer-persisted toasts via overflow', () => {
    const toasts = [
      normalizeToastOptions(toast('drawer-1', { persistInDrawer: true })),
      normalizeToastOptions(toast('drawer-2', { persistInDrawer: true })),
      normalizeToastOptions(toast('drawer-3', { persistInDrawer: true })),
      normalizeToastOptions(toast('drawer-4', { persistInDrawer: true })),
    ];

    expect(getVisibleToasts(toasts, DEFAULT_MAX_DISPLAYED_TOASTS)).toHaveLength(
      DEFAULT_MAX_DISPLAYED_TOASTS,
    );
    expect(getOverflowCount(toasts, DEFAULT_MAX_DISPLAYED_TOASTS)).toBe(1);
  });

  it('should not cap drawer-persisted toasts when skipOverflow is explicitly true', () => {
    const toasts = [
      normalizeToastOptions(toast('pinned-1', { persistInDrawer: true, skipOverflow: true })),
      normalizeToastOptions(toast('pinned-2', { persistInDrawer: true, skipOverflow: true })),
      normalizeToastOptions(toast('pinned-3', { persistInDrawer: true, skipOverflow: true })),
      normalizeToastOptions(toast('pinned-4', { persistInDrawer: true, skipOverflow: true })),
    ];

    expect(getVisibleToasts(toasts, DEFAULT_MAX_DISPLAYED_TOASTS)).toHaveLength(4);
    expect(getOverflowCount(toasts, DEFAULT_MAX_DISPLAYED_TOASTS)).toBe(0);
  });
});
