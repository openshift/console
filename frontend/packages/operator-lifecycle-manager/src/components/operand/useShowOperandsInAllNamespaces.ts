import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';

type UseShowOperandsInAllNamespaces = () => [boolean, (value: boolean) => void];

// This hook can be used to consume and update the showOperandsInAllNamespaces redux state
export const useShowOperandsInAllNamespaces: UseShowOperandsInAllNamespaces = () => {
  const dispatch = useDispatch();
  const showOperandsInAllNamespaces = useSelector((state: RootState) =>
    state.UI.get('showOperandsInAllNamespaces'),
  );
  const setShowOperandsInAllNamespaces = React.useCallback(
    (value: boolean) => dispatch(UIActions.setShowOperandsInAllNamespaces(value)),
    [dispatch],
  );
  return [showOperandsInAllNamespaces, setShowOperandsInAllNamespaces];
};
