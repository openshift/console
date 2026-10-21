import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils/details-item';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import type { K8sPodControllerKind, PodKind } from '@console/internal/module/k8s';
import { referenceForModel, getResourceDescription } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../models';
import AvailabilityRequirement from './AvailabilityRequirement';
import type { PodDisruptionBudgetKind } from './types';
import { getPDBResource } from './utils/get-pdb-resources';

export const PodDisruptionBudgetField: FC<PodDisruptionBudgetFieldProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [pdbResources] = useK8sWatchResource<PodDisruptionBudgetKind[]>({
    groupVersionKind: {
      group: PodDisruptionBudgetModel.apiGroup,
      kind: PodDisruptionBudgetModel.kind,
      version: PodDisruptionBudgetModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace: obj.metadata.namespace,
  });
  const pdb = getPDBResource(pdbResources, obj);
  const { replicas } = obj.spec ?? {};
  const pdbDescription = getResourceDescription(PodDisruptionBudgetModel);

  return (
    <DetailsItem label={t('console-app~PodDisruptionBudget')} description={pdbDescription}>
      {pdb ? (
        <>
          <ResourceLink
            kind={referenceForModel(PodDisruptionBudgetModel)}
            name={pdb.metadata.name}
            namespace={pdb.metadata.namespace}
          />
          {replicas && <AvailabilityRequirement pdb={pdb} replicas={replicas} />}
        </>
      ) : (
        t('console-app~No PodDisruptionBudget')
      )}
    </DetailsItem>
  );
};

type PodDisruptionBudgetFieldProps = {
  obj: K8sPodControllerKind | PodKind;
};
