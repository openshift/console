import type { FC } from 'react';
import { useState, useRef, useCallback } from 'react';
import type { QuickStart } from '@patternfly/quickstarts';
import type { QuickStartsLoaderProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useQuickStarts } from '../utils/useQuickStarts';
import { QuickStartPermissionChecker } from './QuickStartPermissionChecker';

export const QuickStartsLoader: FC<QuickStartsLoaderProps> = ({ children }) => {
  const [quickStarts, quickStartsLoaded] = useQuickStarts();

  const [allowedQuickStarts, setAllowedQuickStarts] = useState<QuickStart[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState<boolean>(false);
  const permissionChecks = useRef<{ [name: string]: boolean }>({});

  const handlePermissionCheck = useCallback(
    (quickStart, hasPermission) => {
      permissionChecks.current[quickStart.metadata.name] = hasPermission;
      if (Object.keys(permissionChecks.current).length === quickStarts.length) {
        const filteredQuickStarts = quickStarts.filter(
          (quickstart) => permissionChecks.current[quickstart.metadata.name],
        );
        setAllowedQuickStarts(filteredQuickStarts);
        setPermissionsLoaded(true);
      }
    },
    [quickStarts],
  );

  return (
    <>
      {quickStarts.map((quickstart) => {
        return (
          <QuickStartPermissionChecker
            key={quickstart.metadata.name}
            quickStart={quickstart}
            onPermissionCheck={handlePermissionCheck}
          />
        );
      })}
      {children(
        allowedQuickStarts,
        quickStartsLoaded && (quickStarts.length === 0 || permissionsLoaded),
      )}
    </>
  );
};
