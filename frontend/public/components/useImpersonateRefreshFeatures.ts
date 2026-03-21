import * as _ from 'lodash';
import { useEffect, useRef } from 'react';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

/**
 * Hook that monitors impersonation state changes and refreshes feature flags when
 * impersonation changes (user, group, or kind changes).
 *
 * This prevents loading spinners by refreshing flags in the background rather than
 * clearing them to a PENDING state.
 */
export const useImpersonateRefreshFeatures = () => {
  const dispatch = useConsoleDispatch();
  const impersonate = useConsoleSelector(getImpersonate);
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
      prevImpersonate.current = current;
    }
  }, [impersonate, dispatch]);
};
