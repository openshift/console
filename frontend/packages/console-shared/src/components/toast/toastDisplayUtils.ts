import type { ToastOptions } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ToastRenderOptions } from './types';

/**
 * Applies default constraints. Drawer-persisted toasts default to `skipOverflow: false`
 * so they participate in the overflow cap, but an explicit `skipOverflow: true` is respected.
 */
export const normalizeToastOptions = <T extends ToastOptions>(toast: T): T => {
  if (toast.persistInDrawer === true && toast.skipOverflow !== true) {
    return { ...toast, skipOverflow: false };
  }
  return toast;
};

const participatesInOverflowCap = (toast: ToastOptions): boolean => toast.skipOverflow === false;

const getCappedToasts = (toasts: ToastRenderOptions[]) =>
  toasts.filter((toast) => participatesInOverflowCap(toast));

export const getVisibleToasts = (
  toasts: ToastRenderOptions[],
  maxDisplayed: number,
): ToastRenderOptions[] => {
  const limit = Math.max(0, maxDisplayed);
  const visibleCappedIds = new Set(
    getCappedToasts(toasts)
      .slice(0, limit)
      .map((toast) => toast.id),
  );

  return toasts.filter(
    (toast) => !participatesInOverflowCap(toast) || visibleCappedIds.has(toast.id),
  );
};

export const getOverflowCount = (toasts: ToastRenderOptions[], maxDisplayed: number): number => {
  const limit = Math.max(0, maxDisplayed);
  const cappedLength = getCappedToasts(toasts).length;
  return Math.max(0, cappedLength - limit);
};
