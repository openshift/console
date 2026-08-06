import type { RootState } from '@console/internal/redux';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import type { DetachedSession } from '../actions/cloud-shell-actions';

export const cloudShellReducerName = 'cloudShell';

export const isCloudShellExpanded = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isExpanded;

export const useIsCloudShellExpanded = () => useConsoleSelector<boolean>(isCloudShellExpanded);

export const isCloudShellActive = (state: RootState): boolean =>
  !!state.plugins?.webterminal?.[cloudShellReducerName]?.isActive;

export const useIsCloudShellActive = () => useConsoleSelector<boolean>(isCloudShellActive);

const getCloudShellCommand = (state: RootState): string | null =>
  state.plugins?.webterminal?.[cloudShellReducerName]?.command ?? null;

export const useGetCloudShellCommand = (): string | null =>
  useConsoleSelector<string | null>(getCloudShellCommand);

export const getDetachedSessions = (state: RootState): DetachedSession[] =>
  state.plugins?.webterminal?.[cloudShellReducerName]?.detachedSessions ?? [];

export const useDetachedSessions = (): DetachedSession[] =>
  useConsoleSelector<DetachedSession[]>(getDetachedSessions);
