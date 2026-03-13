import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const useLocation = () => useConsoleSelector<string>(({ UI }) => UI.get('location') ?? '');
