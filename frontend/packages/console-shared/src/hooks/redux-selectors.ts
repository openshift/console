import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const useActiveNamespace = (): string => {
  return useConsoleSelector<string>(({ UI }) => UI.get('activeNamespace'));
};
