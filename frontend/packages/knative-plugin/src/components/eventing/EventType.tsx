import type { FC } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { Table, TableData } from '@console/internal/components/factory';
import type { K8sResourceKind } from '@console/internal/module/k8s';

const EventTypeHeaders = (t: TFunction) => () => {
  return [
    {
      id: 'attributes',
      title: t('knative-plugin~Attributes'),
    },
    {
      id: 'values',
      title: t('knative-plugin~Values'),
    },
  ];
};

export const EventTypeRow: FC<RowFunctionArgs<{ key: string; value: string }>> = ({ obj }) => {
  return (
    <>
      <TableData columnID="attributes">{obj.key}</TableData>
      <TableData columnID="values">{obj.value}</TableData>
    </>
  );
};

interface EventTypeProps {
  eventType: K8sResourceKind;
}

const EventType: FC<EventTypeProps> = ({ eventType }) => {
  const { t } = useTranslation();

  const specAttributes = ['type', 'source', 'schema'];

  const rows = specAttributes
    .filter((a) => eventType.spec.hasOwnProperty(a))
    .map((a) => {
      return { key: a, value: eventType.spec[a] };
    });

  return (
    <>
      {eventType.spec.description ? eventType.spec.description : ''}
      <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
        <Content component={ContentVariants.h3}>{t('knative-plugin~Event details')}</Content>
      </div>
      <Table
        data={rows}
        defaultSortField={'attributes'}
        defaultSortOrder={SortByDirection.asc}
        aria-label={t('knative-plugin~Event')}
        Header={EventTypeHeaders(t)}
        Row={EventTypeRow}
        loaded
        virtualize
      />
    </>
  );
};

export default EventType;
