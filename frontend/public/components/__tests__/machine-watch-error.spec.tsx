import { screen } from '@testing-library/react';
import { NoModelError } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/k8s-watcher';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  ClusterAPIWatchAlert,
  getClusterAPIWatchAlertKind,
  getClusterAPIWatchError,
  getCombinedListLoadError,
  getMachinePageWatchState,
  isClusterAPIForbiddenError,
  isClusterAPINotInstalledError,
} from '../machine';

const httpError = (status: number, message = `HTTP ${status}`) =>
  Object.assign(new Error(message), { response: { status } });

describe('Cluster API watch error helpers', () => {
  describe('isClusterAPINotInstalledError', () => {
    it('is true for NoModelError and 404', () => {
      expect(isClusterAPINotInstalledError(new NoModelError())).toBe(true);
      expect(isClusterAPINotInstalledError(httpError(404))).toBe(true);
    });

    it('is false for 403, other errors, and empty', () => {
      expect(isClusterAPINotInstalledError(httpError(403))).toBe(false);
      expect(isClusterAPINotInstalledError(httpError(500))).toBe(false);
      expect(isClusterAPINotInstalledError(undefined)).toBe(false);
    });
  });

  describe('isClusterAPIForbiddenError', () => {
    it('is true only for 403', () => {
      expect(isClusterAPIForbiddenError(httpError(403))).toBe(true);
      expect(isClusterAPIForbiddenError(httpError(404))).toBe(false);
      expect(isClusterAPIForbiddenError(new NoModelError())).toBe(false);
      expect(isClusterAPIForbiddenError(undefined)).toBe(false);
    });
  });

  describe('getClusterAPIWatchError', () => {
    it('suppresses missing-model, 404, and 403 so StatusBox will not AccessDenied-hide MAPI', () => {
      expect(getClusterAPIWatchError(undefined)).toBeUndefined();
      expect(getClusterAPIWatchError(new NoModelError())).toBeUndefined();
      expect(getClusterAPIWatchError(httpError(404))).toBeUndefined();
      expect(getClusterAPIWatchError(httpError(403))).toBeUndefined();
    });

    it('passes through other Cluster API errors', () => {
      const err = httpError(500, 'boom');
      expect(getClusterAPIWatchError(err)).toBe(err);
    });
  });

  describe('getCombinedListLoadError', () => {
    it('prefers Machine API loadError', () => {
      const mapErr = httpError(403, 'mapi forbidden');
      expect(getCombinedListLoadError(mapErr, httpError(500), true)).toBe(mapErr);
    });

    it('does not surface Cluster API errors when Machine API loaded successfully', () => {
      expect(getCombinedListLoadError(undefined, httpError(403), true)).toBeUndefined();
      expect(getCombinedListLoadError(undefined, httpError(500), true)).toBeUndefined();
    });

    it('still suppresses ignorable CAPI errors when Machine API has not loaded', () => {
      expect(getCombinedListLoadError(undefined, httpError(403), false)).toBeUndefined();
      expect(getCombinedListLoadError(undefined, httpError(404), false)).toBeUndefined();
    });

    it('returns non-ignorable CAPI errors only before Machine API has loaded', () => {
      const err = httpError(500);
      expect(getCombinedListLoadError(undefined, err, false)).toBe(err);
    });
  });

  describe('getClusterAPIWatchAlertKind', () => {
    it('returns undefined for no error, not-installed, and 404', () => {
      expect(getClusterAPIWatchAlertKind(undefined)).toBeUndefined();
      expect(getClusterAPIWatchAlertKind(new NoModelError())).toBeUndefined();
      expect(getClusterAPIWatchAlertKind(httpError(404))).toBeUndefined();
    });

    it('returns forbidden for 403 and error for other failures', () => {
      expect(getClusterAPIWatchAlertKind(httpError(403))).toBe('forbidden');
      expect(getClusterAPIWatchAlertKind(httpError(500))).toBe('error');
    });
  });

  describe('getMachinePageWatchState', () => {
    const pending = { loaded: false };
    const ok = { loaded: true };
    const forbidden = { loaded: false, loadError: httpError(403) };
    const failed = { loaded: false, loadError: httpError(500, 'boom') };

    it('scopes CAPI Machines tab to CAPI watch only (403 is not suppressed)', () => {
      expect(getMachinePageWatchState(true, pending, ok)).toEqual({
        loaded: true,
        loadError: undefined,
      });
      expect(getMachinePageWatchState(true, pending, forbidden)).toEqual({
        loaded: true,
        loadError: forbidden.loadError,
      });
      // Excluded Machine API pending/fail must not block or replace CAPI tab state
      expect(getMachinePageWatchState(true, failed, ok)).toEqual({
        loaded: true,
        loadError: undefined,
      });
    });

    it('scopes Machine API Machines tab to Machine API watch only', () => {
      expect(getMachinePageWatchState(false, ok, pending)).toEqual({
        loaded: true,
        loadError: undefined,
      });
      expect(getMachinePageWatchState(false, ok, forbidden)).toEqual({
        loaded: true,
        loadError: undefined,
      });
      expect(getMachinePageWatchState(false, forbidden, ok)).toEqual({
        loaded: false,
        loadError: forbidden.loadError,
      });
    });

    it('uses combined Step 4 rules when matchClusterAPI is unset', () => {
      expect(getMachinePageWatchState(undefined, ok, forbidden)).toEqual({
        loaded: true,
        loadError: undefined,
      });
      expect(getMachinePageWatchState(undefined, ok, failed)).toEqual({
        loaded: true,
        loadError: undefined,
      });
      expect(getMachinePageWatchState(undefined, pending, ok)).toEqual({
        loaded: false,
        loadError: undefined,
      });
    });
  });
});

describe('ClusterAPIWatchAlert', () => {
  it('renders nothing when Cluster API is not installed', () => {
    const { container } = renderWithProviders(<ClusterAPIWatchAlert error={new NoModelError()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a warning when Cluster API list is forbidden', () => {
    renderWithProviders(<ClusterAPIWatchAlert error={httpError(403)} />);
    expect(screen.getByText('Cluster API resources could not be listed')).toBeVisible();
    expect(
      screen.getByText(
        'You do not have permission to list Cluster API resources. Machine API resources are still shown.',
      ),
    ).toBeVisible();
  });

  it('shows a danger alert for other Cluster API failures', () => {
    renderWithProviders(<ClusterAPIWatchAlert error={httpError(500, 'watch failed')} />);
    expect(screen.getByText('Cluster API resources could not be loaded')).toBeVisible();
    expect(screen.getByText('watch failed')).toBeVisible();
  });
});
