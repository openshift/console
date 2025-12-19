import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAG_DEVWORKSPACE } from '../../const';
import { useToggleCloudShellExpanded } from '../../redux/actions/cloud-shell-dispatchers';
import { useIsCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import { CloudShellDrawer } from './CloudShellDrawer';

interface CloudShellProps {
  children: React.ReactNode;
}

const CloudShell: Snail.FCC<CloudShellProps> = ({ children }) => {
  const onClose = useToggleCloudShellExpanded();
  const open = useIsCloudShellExpanded();
  const devWorkspaceAvailable = useFlag(FLAG_DEVWORKSPACE);

  if (!devWorkspaceAvailable) {
    return <>{children}</>;
  }
  return (
    <CloudShellDrawer onClose={onClose} open={open}>
      {children}
    </CloudShellDrawer>
  );
};

export default CloudShell;
