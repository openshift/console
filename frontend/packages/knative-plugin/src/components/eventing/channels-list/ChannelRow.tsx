import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  getNameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NamespaceModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s/k8s';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { EventChannelKind } from '../../../types';
import { ChannelConditionTypes } from '../../../types';
import { getCondition, getConditionStats } from '../../../utils/condition-utils';
import { getDynamicChannelModel } from '../../../utils/fetch-dynamic-eventsources-utils';

const ChannelConditions: FC<{ obj: EventChannelKind }> = ({ obj }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <>
      {obj.status
        ? t('{{OKcount}} OK / {{conditionsSize}}', getConditionStats(obj.status.conditions))
        : '-'}
    </>
  );
};

export const getChannelDataViewRows: GetDataViewRows<EventChannelKind> = (data, columns) =>
  data.map(({ obj }) => {
    const {
      metadata: { name, namespace, creationTimestamp, uid },
    } = obj;
    const objReference = referenceFor(obj);
    const kind = getDynamicChannelModel(objReference);
    const context = { [objReference]: obj };
    const readyCondition = obj.status
      ? getCondition(obj.status.conditions, ChannelConditionTypes.Ready)
      : null;
    const rowCells = {
      name: {
        cell: <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />,
        props: getNameCellProps(obj.metadata.name),
      },
      namespace: { cell: <ResourceLink kind={NamespaceModel.kind} name={namespace} /> },
      ready: { cell: (readyCondition && readyCondition.status) || '-' },
      condition: { cell: <ChannelConditions obj={obj} /> },
      type: { cell: kind.label },
      created: { cell: <Timestamp timestamp={creationTimestamp} /> },
      actions: { cell: <LazyActionMenu context={context} />, props: actionsCellProps },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });
