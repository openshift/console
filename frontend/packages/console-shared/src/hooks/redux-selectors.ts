import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const useActiveNamespace = (): string =>
  useConsoleSelector<string>(({ UI }) => UI.activeNamespace);
