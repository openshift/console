import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { PodDisruptionBudgetModel } from '../../models';
import { PodDisruptionBudgetKind } from './types';
import { checkPodDisruptionBudgets } from './utils/get-pdb-resources';

export interface PDBAlertProps {
  namespace: string;
}

export const PDBAlert: React.FC<PDBAlertProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  const resource = React.useMemo(
    () => ({
      groupVersionKind: {
        group: PodDisruptionBudgetModel.apiGroup,
        kind: PodDisruptionBudgetModel.kind,
        version: PodDisruptionBudgetModel.apiVersion,
      },
      isList: true,
      namespaced: true,
      namespace,
    }),
    [namespace],
  );

  const [resources, loaded, loadError] = useK8sWatchResource<PodDisruptionBudgetKind[]>(resource);

  const { count: pdbCount, name: pdbName } = checkPodDisruptionBudgets(resources);
  const getRedirectLink = () => {
    return resourcePathFromModel(PodDisruptionBudgetModel, pdbName || null, namespace);
  };

  const onWarningLinkClick = () => {
    fireTelemetryEvent('PodDisruptionBudget Warning Label Clicked');
  };

  return (
    <>
      {pdbCount > 0 && loaded && !loadError && (
        <Label status="warning" variant="outline">
          <Link to={getRedirectLink()} data-test="pdb-warning" onClick={onWarningLinkClick}>
            <Trans t={t} ns="console-app" count={pdbCount}>
              {{ count: pdbCount }} PodDisruptionBudget violated
            </Trans>
          </Link>
        </Label>
      )}
    </>
  );
};

export default PDBAlert;
