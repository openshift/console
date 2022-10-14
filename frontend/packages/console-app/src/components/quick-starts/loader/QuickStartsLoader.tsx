import * as React from 'react';
import { QuickStart, isDisabledQuickStart, getDisabledQuickStarts } from '@patternfly/quickstarts';
import { QuickStartsLoaderProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { QuickStartModel } from '../../../models';
import QuickStartPermissionChecker from './QuickStartPermissionChecker';

const QuickStartsLoader: React.FC<QuickStartsLoaderProps> = ({ children }) => {
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    kind: referenceForModel(QuickStartModel),
    isList: true,
  });

  const enabledQuickstarts = React.useMemo(() => {
    const disabledQuickStarts = getDisabledQuickStarts();
    if (quickStartsLoaded && disabledQuickStarts.length > 0) {
      return quickStarts.filter((qs) => !isDisabledQuickStart(qs, disabledQuickStarts));
    }
    return quickStarts;
  }, [quickStarts, quickStartsLoaded]);

  const [allowedQuickStarts, setAllowedQuickStarts] = React.useState<QuickStart[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = React.useState<boolean>(false);
  const permissionChecks = React.useRef<{ [name: string]: boolean }>({});

  const handlePermissionCheck = React.useCallback(
    (quickStart, hasPermission) => {
      permissionChecks.current[quickStart.metadata.name] = hasPermission;
      if (Object.keys(permissionChecks.current).length === enabledQuickstarts.length) {
        const filteredQuickStarts = enabledQuickstarts.filter(
          (quickstart) => permissionChecks.current[quickstart.metadata.name],
        );
        setAllowedQuickStarts(filteredQuickStarts);
        setPermissionsLoaded(true);
      }
    },
    [enabledQuickstarts],
  );

  return (
    <>
      {enabledQuickstarts.map((quickstart) => {
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
        quickStartsLoaded && (enabledQuickstarts.length === 0 || permissionsLoaded),
      )}
    </>
  );
};

export default QuickStartsLoader;
