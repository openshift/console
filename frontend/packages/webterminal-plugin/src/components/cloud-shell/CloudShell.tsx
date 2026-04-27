import type { FC } from 'react';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAG_DEVWORKSPACE } from '../../const';
import { useToggleCloudShellExpanded } from '../../redux/actions/cloud-shell-dispatchers';
import {
  useIsCloudShellExpanded,
  useDetachedSessions,
} from '../../redux/reducers/cloud-shell-selectors';
import { CloudShellDrawer } from './CloudShellDrawer';

interface CloudShellProps {
  children: React.ReactNode;
}

const CloudShell: FC<CloudShellProps> = ({ children }) => {
  const onClose = useToggleCloudShellExpanded();
  const open = useIsCloudShellExpanded();
  const devWorkspaceAvailable = useFlag(FLAG_DEVWORKSPACE);
  const detachedSessions = useDetachedSessions();

  const hasDetachedSessions = detachedSessions.length > 0;

  if (!devWorkspaceAvailable && !hasDetachedSessions) {
    return <>{children}</>;
  }
  return (
    <CloudShellDrawer onClose={onClose} open={open || hasDetachedSessions}>
      {children}
    </CloudShellDrawer>
  );
};

export default CloudShell;
