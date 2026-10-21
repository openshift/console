import { useCallback } from 'react';
import * as UIActions from '@console/internal/actions/ui';
import type { DeprecatedOperatorWarning } from '@console/operator-lifecycle-manager/src/types';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const useDeprecatedOperatorWarnings = () => {
  const dispatch = useConsoleDispatch();

  const deprecatedPackage = useConsoleSelector<DeprecatedOperatorWarning>((state) =>
    state.UI.getIn(['deprecatedOperator', 'package']),
  );
  const deprecatedChannel = useConsoleSelector<DeprecatedOperatorWarning>((state) =>
    state.UI.getIn(['deprecatedOperator', 'channel']),
  );
  const deprecatedVersion = useConsoleSelector<DeprecatedOperatorWarning>((state) =>
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
