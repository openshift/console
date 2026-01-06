import * as _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getImpersonate } from '@console/dynamic-plugin-sdk';
import * as UIActions from '../actions/ui';

/**
 * Hook that monitors impersonation state changes and refreshes feature flags when
 * impersonation changes (user, group, or kind changes).
 *
 * This prevents loading spinners by refreshing flags in the background rather than
 * clearing them to a PENDING state.
 */
export const useImpersonateRefreshFeatures = () => {
  const dispatch = useDispatch();
  const impersonate = useSelector(getImpersonate);
  const prevImpersonate = useRef(impersonate);

  useEffect(() => {
    const prev = prevImpersonate.current;
    const current = impersonate;

    // Check if impersonation state actually changed
    const impersonateChanged =
      prev?.name !== current?.name ||
      prev?.kind !== current?.kind ||
      !_.isEqual(prev?.groups, current?.groups);

    if (impersonateChanged) {
      // Impersonation changed - refresh feature flags in the background
      // We don't clear flags (no PENDING state), just re-detect them
      // This prevents loading spinners while allowing permissions to update
      dispatch(UIActions.refreshFeaturesAfterImpersonation());
      prevImpersonate.current = current;
    }
  }, [impersonate, dispatch]);
};
