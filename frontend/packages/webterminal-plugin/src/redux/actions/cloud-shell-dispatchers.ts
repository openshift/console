import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setCloudShellCommand } from './cloud-shell-actions';

export const useCloudShellCommandDispatch = (): ((command: string | null) => void) => {
  const dispatch = useDispatch();
  return useCallback(
    (command: string) => {
      dispatch(setCloudShellCommand(command));
    },
    [dispatch],
  );
};
