import * as React from 'react';
import * as _ from 'lodash-es';

import { ListPage } from './factory';
import { ResourceLink } from './utils/resource-link';
import { Selector } from './utils/selector';
import { LoadingBox } from './utils/status-box';
import { ServiceMonitorModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  initialFiltersDefault,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { DASH } from '@console/shared/src/constants/ui';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const serviceMonitorTableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'serviceSelector' },
  { id: 'monitoringNamespace' },
  { id: 'actions' },
];

const namespaceSelectorLinks = ({ spec }) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, (n) => (
      <span key={n}>
        <ResourceLink kind="Namespace" name={n} title={n} />
        &nbsp;&nbsp;
      </span>
    ));
  }
  return <span className="pf-v6-u-text-color-subtle">--</span>;
};

const serviceSelectorLinks = ({ spec }) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, (n) => (
      <span key={n}>
        <Selector selector={spec.selector} kind="Service" namespace={n} />
        &nbsp;&nbsp;
      </span>
    ));
  }
  return <Selector selector={spec.selector} kind="Service" />;
};

const getServiceMonitorDataViewRows = (data, columns) => {
  return data.map(({ obj }) => {
    const { metadata } = obj;
    const resourceKind = referenceForModel(ServiceMonitorModel);

    const rowCells = {
      [serviceMonitorTableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={resourceKind}
            name={metadata.name}
            namespace={metadata.namespace}
            title={metadata.uid}
          />
        ),
        props: getNameCellProps(metadata.name),
      },
      [serviceMonitorTableColumnInfo[1].id]: {
        cell: (
          <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
        ),
      },
      [serviceMonitorTableColumnInfo[2].id]: {
        cell: serviceSelectorLinks(obj),
      },
      [serviceMonitorTableColumnInfo[3].id]: {
        cell: namespaceSelectorLinks(obj),
      },
      [serviceMonitorTableColumnInfo[4].id]: {
        cell: <LazyActionMenu context={{ [referenceForModel(ServiceMonitorModel)]: obj }} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const useServiceMonitorColumns = () => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
      {
        title: t('public~Name'),
        id: serviceMonitorTableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: serviceMonitorTableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Service Selector'),
        id: serviceMonitorTableColumnInfo[2].id,
        sort: 'spec.selector',
        props: {
          modifier: 'nowrap',
          width: 25,
        },
      },
      {
        title: t('public~Monitoring Namespace'),
        id: serviceMonitorTableColumnInfo[3].id,
        sort: 'spec.namespaceSelector',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: serviceMonitorTableColumnInfo[4].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

export const ServiceMonitorsList = (props) => {
  const { data, loaded } = props;
  const columns = useServiceMonitorColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        data={data}
        loaded={loaded}
        label={ServiceMonitorModel.labelPlural}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getServiceMonitorDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const ServiceMonitorsPage = (props) => (
  <ListPage
    {...props}
    canCreate={true}
    kind={referenceForModel(ServiceMonitorModel)}
    ListComponent={ServiceMonitorsList}
    omitFilterToolbar={true}
  />
);
