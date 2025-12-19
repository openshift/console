import * as React from 'react';
import { useCloudShellCommandDispatch } from '../../redux/actions/cloud-shell-dispatchers';
import { useGetCloudShellCommand } from '../../redux/reducers/cloud-shell-selectors';

type ExecuteCommandProps = {
  onCommand: (command: string) => void;
};

const ExecuteCommand: Snail.FCC<ExecuteCommandProps> = ({ onCommand }) => {
  const command = useGetCloudShellCommand();
  const setCloudShellCommand = useCloudShellCommandDispatch();

  React.useEffect(() => {
    if (command) {
      onCommand(command);
      setCloudShellCommand(null);
    }
  }, [command, setCloudShellCommand, onCommand]);

  return null;
};

export default ExecuteCommand;
