import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';
import { ConfigMapModel } from '../models';

const menuActions = [...Kebab.getExtensionsActionsForKind(ConfigMapModel), ...Kebab.factory.common];

const kind = 'ConfigMap';

const tableColumnClasses = ['', '', 'hidden-xs', 'hidden-xs', Kebab.columnClass];

const ConfigMapTableRow = ({ obj: configMap, index, key, style }) => {
  return (
    <TableRow id={configMap.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="ConfigMap"
          name={configMap.metadata.name}
          namespace={configMap.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={configMap.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.size(configMap.data) + _.size(configMap.binaryData)}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={configMap.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={configMap} />
      </TableData>
    </TableRow>
  );
};

const ConfigMaps = (props) => {
  const { t } = useTranslation();
  const ConfigMapTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Size'),
      sortFunc: 'dataSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label="Config Maps"
      Header={ConfigMapTableHeader}
      Row={ConfigMapTableRow}
      virtualize
    />
  );
};

const ConfigMapsPage = (props) => (
  <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />
);

const ConfigMapsDetailsPage = (props) => {
  const { t } = useTranslation();
  const ConfigMapDetails = ({ obj: configMap }) => {
    return (
      <>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~ConfigMap details')} />
          <div className="row">
            <div className="col-md-6">
              <ResourceSummary resource={configMap} />
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Data')} />
          <ConfigMapData data={configMap.data} label="Data" />
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Binary data')} />
          <ConfigMapBinaryData data={configMap.binaryData} />
        </div>
      </>
    );
  };

  return (
    <DetailsPage
      {...props}
      menuActions={menuActions}
      pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
    />
  );
};

export { ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage };
