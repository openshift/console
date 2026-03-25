import type { FC } from 'react';
import { useEffect } from 'react';
import type { QuickStart } from '@patternfly/quickstarts';
import { useQuickStartPermission } from '../utils/useQuickStartPermission';

type QuickStartPermissionCheckerProps = {
  quickStart: QuickStart;
  onPermissionCheck: (quickStart: QuickStart, hasPermission: boolean) => void;
};

export const QuickStartPermissionChecker: FC<QuickStartPermissionCheckerProps> = ({
  quickStart,
  onPermissionCheck,
}) => {
  const [hasPermission, loaded] = useQuickStartPermission(quickStart);

  useEffect(() => {
    if (loaded) {
      onPermissionCheck(quickStart, hasPermission);
    }
  }, [hasPermission, loaded, onPermissionCheck, quickStart]);

  return null;
};
