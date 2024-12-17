import { useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { DeprecatedOperatorWarning } from '@console/operator-lifecycle-manager/src/types';

export const useDeprecatedOperatorWarnings = () => {
  const dispatch = useDispatch();

  const deprecatedPackage = useSelector((state: RootState) =>
    state.UI.getIn(['deprecatedOperator', 'package']),
  );
  const deprecatedChannel = useSelector((state: RootState) =>
    state.UI.getIn(['deprecatedOperator', 'channel']),
  );
  const deprecatedVersion = useSelector((state: RootState) =>
    state.UI.getIn(['deprecatedOperator', 'version']),
  );

  const setDeprecatedPackage = useCallback(
    (value: DeprecatedOperatorWarning) => dispatch(UIActions.setDeprecatedPackage(value)),
    [dispatch],
  );

  const setDeprecatedChannel = useCallback(
    (value: DeprecatedOperatorWarning) => dispatch(UIActions.setDeprecatedChannel(value)),
    [dispatch],
  );

  const setDeprecatedVersion = useCallback(
    (value: DeprecatedOperatorWarning) => dispatch(UIActions.setDeprecatedVersion(value)),
    [dispatch],
  );

  return {
    deprecatedPackage,
    setDeprecatedPackage,
    deprecatedChannel,
    setDeprecatedChannel,
    deprecatedVersion,
    setDeprecatedVersion,
  };
};
