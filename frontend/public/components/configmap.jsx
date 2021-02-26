import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { ConfigMapModel } from '../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

const menuActions = [...Kebab.getExtensionsActionsForKind(ConfigMapModel), ...Kebab.factory.common];

const kind = 'ConfigMap';

const tableColumnClasses = ['', '', 'hidden-xs', 'hidden-xs', Kebab.columnClass];

const ConfigMapTableHeader = t => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_18'),
      sortFunc: 'dataSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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
        <ResourceLink kind="ConfigMap" name={configMap.metadata.name} namespace={configMap.metadata.namespace} title={configMap.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={configMap.metadata.namespace} title={configMap.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{_.size(configMap.data) + _.size(configMap.binaryData)}</TableData>
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
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_27')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <ResourceSummary resource={configMap} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DATA_1')} />
        <ConfigMapData data={configMap.data} label={t('COMMON:MSG_DETAILS_TABDETAILS_DATA_1')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('SINGLE:MSG_CONFIGMAPS_CONFIGMAPDETAILS_TABDETAILS_BINARYDATA_1')} />
        <ConfigMapBinaryData data={configMap.binaryData} />
      </div>
    </>
  );
};

const ConfigMaps = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Config Maps" Header={ConfigMapTableHeader.bind(null, t)} Row={ConfigMapTableRow} virtualize />;
};

const ConfigMapsPage = props => <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />;
const ConfigMapsDetailsPage = props => <DetailsPage {...props} menuActions={menuActions} pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]} />;

export { ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage };
