import * as React from 'react';
import { QuickStart, isDisabledQuickStart, getDisabledQuickStarts } from '@patternfly/quickstarts';
import { QuickStartsLoaderProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { QuickStartModel } from '../../../models';
import QuickStartPermissionChecker from './QuickStartPermissionChecker';

const QuickStartsLoader: React.FC<QuickStartsLoaderProps> = ({ children }) => {
  const [quickStarts, quickStartsLoaded, quickStartsError] = useK8sWatchResource<QuickStart[]>({
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
  const [permissionsResolved, setPermissionsResolved] = React.useState<boolean>(false);
  const permissionCheckResults = React.useRef<{ [name: string]: boolean }>({});

  const handlePermissionCheck = React.useCallback(
    (quickStart, hasPermission) => {
      permissionCheckResults.current[quickStart.metadata.name] = hasPermission;
      if (Object.keys(permissionCheckResults.current).length === enabledQuickstarts.length) {
        const filteredQuickStarts = enabledQuickstarts.filter(
          (quickstart) => permissionCheckResults.current[quickstart.metadata.name],
        );
        setAllowedQuickStarts(filteredQuickStarts);
        setPermissionsResolved(true);
      }
    },
    [enabledQuickstarts],
  );

  // Show content (see QuickStartDrawer) when
  // 1. Quick starts are loaded or couldn't loaded (error)
  // 2. When there is no quick start or all permission checks are resolved.
  const loaded =
    (quickStartsLoaded || !!quickStartsError) &&
    (enabledQuickstarts.length === 0 || permissionsResolved);

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
      {children(allowedQuickStarts, loaded)}
    </>
  );
};

export default QuickStartsLoader;
