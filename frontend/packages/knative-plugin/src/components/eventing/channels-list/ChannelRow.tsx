import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { EventChannelKind, ChannelConditionTypes } from '../../../types';
import { getCondition, getConditionStats } from '../../../utils/condition-utils';
import { getDynamicChannelModel } from '../../../utils/fetch-dynamic-eventsources-utils';

const ChannelRow: React.FC<RowFunctionArgs<EventChannelKind>> = ({ obj }) => {
  const {
    metadata: { name, namespace, creationTimestamp, uid } = {
      name: '',
      namespace: '',
      creationTimestamp: '',
      uid: '',
    },
  } = obj;
  const { t } = useTranslation();
  const objReference = referenceFor(obj);
  const kind = getDynamicChannelModel(objReference);
  const context = { [objReference]: obj };
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ChannelConditionTypes.Ready)
    : null;
  return (
    <>
      <TableData>
        <ResourceLink kind={objReference} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData className="co-break-word" columnID="namespace">
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData columnID="ready">{(readyCondition && readyCondition.status) || '-'}</TableData>
      <TableData columnID="condition">
        {obj.status
          ? t(
              'knative-plugin~{{OKcount}} OK / {{conditionsSize}}',
              getConditionStats(obj.status.conditions),
            )
          : '-'}
      </TableData>
      <TableData>{kind?.label ?? ''}</TableData>
      <TableData>
        <Timestamp timestamp={creationTimestamp ?? ''} />
      </TableData>
      <TableData className={Kebab.columnClass}>
        <LazyActionMenu context={context} />;
      </TableData>
    </>
  );
};

export default ChannelRow;
