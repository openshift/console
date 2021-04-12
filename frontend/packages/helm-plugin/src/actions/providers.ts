import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getHelmDeleteAction, getHelmRollbackAction, getHelmUpgradeAction } from './creators';
import { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const { t } = useTranslation();
  const actions = React.useMemo(
    () => [
      getHelmUpgradeAction(scope, t),
      getHelmRollbackAction(scope, t),
      getHelmDeleteAction(scope, t),
    ],
    [scope, t],
  );

  return [actions, true, undefined];
};
