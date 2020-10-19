import * as React from 'react';
import { QuickStart } from '../utils/quick-start-types';
import useQuickStartPermission from '../utils/useQuickStartPermission';

type QuickStartPermissionCheckerProps = {
  quickStart: QuickStart;
  onPermissionCheck: (quickStart: QuickStart, hasPermission: boolean) => void;
};

const QuickStartPermissionChecker: React.FC<QuickStartPermissionCheckerProps> = ({
  quickStart,
  onPermissionCheck,
}) => {
  const [hasPermission, loaded] = useQuickStartPermission(quickStart);

  React.useEffect(() => {
    if (loaded) {
      onPermissionCheck(quickStart, hasPermission);
    }
  }, [hasPermission, loaded, onPermissionCheck, quickStart]);

  return null;
};

export default QuickStartPermissionChecker;
