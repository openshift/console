import type { RootState } from '@console/internal/redux';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const cloudShellReducerName = 'cloudShell';

export const isCloudShellExpanded = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isExpanded;

export const useIsCloudShellExpanded = () => {
  return useConsoleSelector<boolean>(isCloudShellExpanded);
};

export const isCloudShellActive = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isActive;

export const useIsCloudShellActive = () => {
  return useConsoleSelector<boolean>(isCloudShellActive);
};

export const getCloudShellCommand = (state: RootState): string | null =>
  state.plugins?.webterminal?.[cloudShellReducerName]?.command ?? null;

export const useGetCloudShellCommand = (): string | null => {
  return useConsoleSelector<string | null>(getCloudShellCommand);
};
