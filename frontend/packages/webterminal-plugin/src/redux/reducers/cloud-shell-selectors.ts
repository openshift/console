import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const cloudShellReducerName = 'cloudShell';

export const isCloudShellExpanded = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isExpanded;

export const useIsCloudShellExpanded = (): boolean => {
  return useSelector(isCloudShellExpanded);
};

export const isCloudShellActive = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isActive;

export const useIsCloudShellActive = (): boolean => {
  return useSelector(isCloudShellActive);
};

export const getCloudShellCommand = (state: RootState): string | null =>
  state.plugins?.webterminal?.[cloudShellReducerName]?.command ?? null;

export const useGetCloudShellCommand = (): string | null => {
  return useSelector(getCloudShellCommand);
};
