import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { RootState, useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';

type WarningPolicy = {
  warning: string;
  kind: string;
  name: string;
};

type UseWarningPolicy = [WarningPolicy, (value: UIActions.WarningPolicy) => void];

export const useWarningPolicy = (): UseWarningPolicy => {
  const dispatch = useDispatch();
  const wp = useSelector((state: RootState) => state.UI.get('warningPolicy'));

  const headers = React.useMemo(() => Object.fromEntries(wp?.headers || []), [wp]);
  const warningPolicy: WarningPolicy = {
    warning: headers?.warning,
    kind: wp?.kind,
    name: wp?.name,
  };

  const setWarningPolicy = React.useCallback(
    (value: UIActions.WarningPolicy) => dispatch(UIActions.setWarningPolicy(value)),
    [dispatch],
  );

  return [warningPolicy, setWarningPolicy];
};
