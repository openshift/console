import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import ListPageCreate from '@console/internal/components/factory/ListPage/ListPageCreate';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../models';
import PodDisruptionBudgetList from './PDBList';
import type { PodDisruptionBudgetKind } from './types';

export const PodDisruptionBudgetsPage: FC<PodDisruptionBudgetsPageProps> = ({
  namespace,
  showTitle = true,
}) => {
  const { t } = useTranslation();
  const [resources, loaded, loadError] = useK8sWatchResource<PodDisruptionBudgetKind[]>({
    groupVersionKind: {
      group: PodDisruptionBudgetModel.apiGroup,
      kind: PodDisruptionBudgetModel.kind,
      version: PodDisruptionBudgetModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  const resourceKind = referenceForModel(PodDisruptionBudgetModel);
  const accessReview = {
    groupVersionKind: resourceKind,
    namespace: namespace || 'default',
  };
  return (
    <>
      <ListPageHeader title={showTitle ? t(PodDisruptionBudgetModel.labelPluralKey) : undefined}>
        <ListPageCreate groupVersionKind={resourceKind} createAccessReview={accessReview}>
          {t('console-app~Create PodDisruptionBudget')}
        </ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <PodDisruptionBudgetList data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type PodDisruptionBudgetsPageProps = {
  namespace: string;
  showTitle?: boolean;
};
