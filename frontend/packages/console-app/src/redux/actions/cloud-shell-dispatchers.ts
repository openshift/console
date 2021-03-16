import { useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
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
