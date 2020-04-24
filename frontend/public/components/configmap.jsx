import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
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

const ConfigMapTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Size',
      sortFunc: 'dataSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
ConfigMapTableHeader.displayName = 'ConfigMapTableHeader';

const ConfigMapTableRow = ({ obj: configMap, index, key, style }) => {
  return (
    <TableRow id={configMap.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="ConfigMap"
          name={configMap.metadata.name}
          namespace={configMap.metadata.namespace}
          title={configMap.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={configMap.metadata.namespace}
          title={configMap.metadata.namespace}
        />
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

const ConfigMapDetails = ({ obj: configMap }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Config Map Details" />
        <ResourceSummary resource={configMap} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Data" />
        <ConfigMapData data={configMap.data} label="Data" />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Binary Data" />
        <ConfigMapBinaryData data={configMap.binaryData} />
      </div>
    </>
  );
};

const ConfigMaps = (props) => (
  <Table
    {...props}
    aria-label="Config Maps"
    Header={ConfigMapTableHeader}
    Row={ConfigMapTableRow}
    virtualize
  />
);

const ConfigMapsPage = (props) => (
  <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />
);
const ConfigMapsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
  />
);

export { ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage };
