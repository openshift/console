import * as _ from 'lodash-es';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData, TableProps } from './factory';
import { ConfigMapData, ConfigMapBinaryData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Grid, GridItem } from '@patternfly/react-core';
import { ConfigMapKind } from '@console/internal/module/k8s';

const menuActions = [...Kebab.factory.common];

const kind = 'ConfigMap';

const tableColumnClasses = [
  '',
  'pf-v6-u-display-none pf-v6-u-display-table-cell-on-sm',
  'pf-v6-u-display-none pf-v6-u-display-table-cell-on-sm',
  'pf-v6-u-display-none pf-v6-u-display-table-cell-on-md',
  Kebab.columnClass,
];

const ConfigMapTableRow: React.FCC<{ obj: ConfigMapKind }> = ({ obj: configMap }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="ConfigMap"
          name={configMap.metadata.name}
          namespace={configMap.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
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
    </>
  );
};

export const ConfigMaps: React.FCC<Partial<TableProps>> = (props) => {
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
      aria-label={t('public~ConfigMaps')}
      Header={ConfigMapTableHeader}
      Row={ConfigMapTableRow}
      virtualize
    />
  );
};

export const ConfigMapsPage = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/configmaps/~new/form`,
  };
  return (
    <ListPage ListComponent={ConfigMaps} canCreate={true} createProps={createProps} {...props} />
  );
};

export const ConfigMapsDetailsPage = (props) => {
  const { t } = useTranslation();
  const ConfigMapDetails = ({ obj: configMap }: { obj: ConfigMapKind }) => {
    return (
      <>
        <PaneBody>
          <SectionHeading text={t('public~ConfigMap details')} />
          <Grid hasGutter>
            <GridItem md={6}>
              <ResourceSummary resource={configMap} />
            </GridItem>
          </Grid>
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Data')} />
          <ConfigMapData data={configMap.data} label={t('public~Data')} />
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Binary data')} />
          <ConfigMapBinaryData data={configMap.binaryData} />
        </PaneBody>
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
