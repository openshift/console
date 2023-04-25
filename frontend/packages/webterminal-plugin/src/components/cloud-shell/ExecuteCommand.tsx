import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { useCloudShellCommandDispatch } from '../../redux/actions/cloud-shell-dispatchers';
import { getCloudShellCommand } from '../../redux/reducers/cloud-shell-selectors';

type ExecuteCommandProps = {
  onCommand: (command: string) => void;
};

const ExecuteCommand: React.FC<ExecuteCommandProps> = ({ onCommand }) => {
  const command = useSelector(getCloudShellCommand);
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
