import { useCallback } from 'react';
import * as UIActions from '@console/internal/actions/ui';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

type UseShowOperandsInAllNamespaces = () => [boolean, (value: boolean) => void];

// This hook can be used to consume and update the showOperandsInAllNamespaces redux state
export const useShowOperandsInAllNamespaces: UseShowOperandsInAllNamespaces = () => {
  const dispatch = useConsoleDispatch();
  const showOperandsInAllNamespaces = useConsoleSelector((state) =>
    state.UI.get('showOperandsInAllNamespaces'),
  );
  const setShowOperandsInAllNamespaces = useCallback(
    (value: boolean) => dispatch(UIActions.setShowOperandsInAllNamespaces(value)),
    [dispatch],
  );
  return [showOperandsInAllNamespaces, setShowOperandsInAllNamespaces];
};
