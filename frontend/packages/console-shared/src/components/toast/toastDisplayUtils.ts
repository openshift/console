import type { ToastOptions } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ToastRenderOptions } from './types';

/**
 * Enforces toast option constraints. Ephemeral toasts (`persistInDrawer: false`) must
 * bypass the overflow cap; otherwise they could be hidden with no drawer entry.
 */
export const normalizeToastOptions = <T extends ToastOptions>(toast: T): T => {
  if (toast.persistInDrawer === false) {
    return { ...toast, skipOverflow: true };
  }
  return toast;
};

const participatesInOverflowCap = (toast: ToastOptions): boolean => toast.skipOverflow !== true;

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
