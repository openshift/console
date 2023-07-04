import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { QuickStartsLoaderProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useQuickStarts } from '../utils/useQuickStarts';
import QuickStartPermissionChecker from './QuickStartPermissionChecker';

const QuickStartsLoader: React.FC<QuickStartsLoaderProps> = ({ children }) => {
  const [quickStarts, quickStartsLoaded] = useQuickStarts();

  const [allowedQuickStarts, setAllowedQuickStarts] = React.useState<QuickStart[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = React.useState<boolean>(false);
  const permissionChecks = React.useRef<{ [name: string]: boolean }>({});

  const handlePermissionCheck = React.useCallback(
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

export default QuickStartsLoader;
