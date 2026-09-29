import type { FC } from 'react';
import { useMemo } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind } from '@console/internal/module/k8s/types';
import { EventingEventTypeModel } from '../../models';

type EventAttribute = { key: string; value: string };

const getDataViewRows: GetDataViewRows<EventAttribute> = (data, columns) =>
  data.map(({ obj }) =>
    columns.map(({ id }) => ({ id, cell: id === 'attributes' ? obj.key : obj.value })),
  );

const getObjectMetadata = ({ key }: EventAttribute) => ({ name: key });

interface EventTypeProps {
  eventType: K8sResourceKind;
}

export const EventType: FC<EventTypeProps> = ({ eventType }) => {
  const { t } = useTranslation('knative-plugin');
  const { getResizableProps, resetAllColumnWidths } =
    useColumnWidthSettings(EventingEventTypeModel);
  const columns = useMemo<ConsoleDataViewColumn<EventAttribute>[]>(
    () => [
      { id: 'attributes', resizableProps: getResizableProps('attributes'), title: t('Attributes') },
      { id: 'values', resizableProps: getResizableProps('values'), title: t('Values') },
    ],
    [t, getResizableProps],
  );

  const specAttributes = ['type', 'source', 'schema'];

  const rows = specAttributes
    .filter((a) => eventType.spec.hasOwnProperty(a))
    .map((a) => ({ key: a, value: eventType.spec[a] }));

  return (
    <>
      {eventType.spec.description ? eventType.spec.description : ''}
      <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
        <Content component={ContentVariants.h3}>{t('Event details')}</Content>
      </div>
      <ConsoleDataView<EventAttribute>
        data={rows}
        label={t('Event')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        getObjectMetadata={getObjectMetadata}
        loaded
        hideNameLabelFilters
        hideColumnManagement
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </>
  );
};
