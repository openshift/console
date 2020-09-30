import * as React from 'react';
import { QuickStart } from '../utils/quick-start-types';
import { getQuickStarts } from '../utils/quick-start-utils';
import QuickStartPermissionChecker from './QuickStartPermissionChecker';

type QuickStartsLoaderProps = {
  children: (quickStarts: QuickStart[], loaded: boolean) => React.ReactNode;
};

const QuickStartsLoader: React.FC<QuickStartsLoaderProps> = ({ children }) => {
  const [quickStarts, setQuickStarts] = React.useState<QuickStart[]>([]);
  const [allowedQuickStarts, setAllowedQuickStarts] = React.useState<QuickStart[]>([]);
  const [loaded, setLoaded] = React.useState<boolean>(!(quickStarts.length > 0));
  const permissionChecks = React.useRef<{ [name: string]: boolean }>({});

  React.useEffect(() => {
    setQuickStarts(getQuickStarts());
  }, []);

  const handlePermissionCheck = React.useCallback(
    (quickStart, hasPermission) => {
      permissionChecks.current[quickStart.metadata.name] = hasPermission;
      if (Object.keys(permissionChecks.current).length === quickStarts.length) {
        const filteredQuickStarts = quickStarts.filter(
          (qs) => permissionChecks.current[qs.metadata.name],
        );
        setAllowedQuickStarts(filteredQuickStarts);
        setLoaded(true);
      }
    },
    [quickStarts],
  );

  return (
    <>
      {quickStarts.map((qs) => {
        return (
          <QuickStartPermissionChecker
            key={qs.metadata.name}
            quickStart={qs}
            onPermissionCheck={handlePermissionCheck}
          />
        );
      })}
      {children(allowedQuickStarts, loaded)}
    </>
  );
};

export default QuickStartsLoader;
