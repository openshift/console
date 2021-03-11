import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ExternalRegistryModel } from '../../models/hypercloud';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { RepositoriesPage } from './repository';
import { scanningModal } from './modals';
import { withRouter } from 'react-router-dom';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ExternalRegistryModel), ...Kebab.factory.common, Kebab.factory.ModifyScanning];

const kind = ExternalRegistryModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-xl'), Kebab.columnClass];

const ExternalRegistryTableHeader = (t?: TFunction) => {
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
      title: t('SINGLE:MSG_VIRTUALMACHINES_CREATEFORM_STEP1_DIV2_5'),
      sortField: 'spec.registryUrl',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Registry Type',
      sortField: 'spec.registryType',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.state',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

ExternalRegistryTableHeader.displayName = 'ExternalRegistryTableHeader';

const ExternalRegistryTableRow: RowFunction<K8sResourceKind> = ({ obj: registry, index, key, style }) => {
  return (
    <TableRow id={registry.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={registry.metadata.name} namespace={registry.metadata.namespace} title={registry.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={registry.metadata.namespace} title={registry.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{registry.spec.registryUrl}</TableData>
      <TableData className={tableColumnClasses[3]}>{registry.spec.registryType}</TableData>
      <TableData className={classNames(tableColumnClasses[4], 'co-break-word')}>
        <Status status={registry.status.state} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={registry.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={registry} />
      </TableData>
    </TableRow>
  );
};

export const ExternalRegistryDetailsList: React.FC<ExternalRegistryDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={`${t('SINGLE:MSG_VIRTUALMACHINES_CREATEFORM_STEP1_DIV2_6')} ${t('SINGLE:MSG_VIRTUALMACHINES_CREATEFORM_STEP1_DIV2_5')}`} obj={ds} path="spec.registryUrl">
        {ds.spec.registryUrl}
      </DetailsItem>
      <DetailsItem label={`${t('SINGLE:MSG_VIRTUALMACHINES_CREATEFORM_STEP1_DIV2_6')} ${t('SINGLE:MSG_VIRTUALMACHINES_CREATEFORM_STEP2_POPUP_5')}`} obj={ds} path="spec.registryType">
        {ds.spec.registryType}
      </DetailsItem>
      <DetailsItem label={`${t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_4')}`} obj={ds} path="status.state">
        <Status status={ds.status.state} />
      </DetailsItem>
    </dl>
  );
};

const ExternalRegistryDetails: React.FC<ExternalRegistryDetailsProps> = ({ obj: registry }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_97')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={registry} />
          </div>
          <div className="col-lg-6">
            <ExternalRegistryDetailsList ds={registry} />
          </div>
        </div>
      </div>
    </>
  );
}

const { details, editYaml } = navFactory;

export const ExternalRegistries: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="ExternalRegistries" Header={ExternalRegistryTableHeader.bind(null, t)} Row={ExternalRegistryTableRow} virtualize />;
};

const registryStatusReducer = (registry: any): string => {
  return registry.status.state;
};

const filters = [
  {
    filterGroupName: 'Status',
    type: 'registry-status',
    reducer: registryStatusReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Not Ready', title: 'Not Ready' },
      { id: 'Creating', title: 'Creating' },
    ],
  },
];

const registryCreateAction = (history, item) => {
  const pathname = window.location.pathname;
  const pathNameSplit = pathname.split('/');
  const allNS = pathNameSplit[2];
  let ns;
  if (allNS !== 'all-namespaces') {
    ns = pathNameSplit[3];
  }

  switch (item) {
    case 'scan':
      scanningModal({ kind: 'ExternalRegistry', ns, showNs: true });
      break;
    case 'generic':
      history.push('/');
      if (allNS === 'all-namespaces') {
        history.push('/k8s/ns/default/externalregistries/~new');
      } else {
        history.push(`/k8s/ns/${ns}/externalregistries/~new`);
      }
      break;
  }
}

export const ExternalRegistriesPage = withRouter(props => {
  const createItems = {
    generic: 'Create External Registry',
    scan: 'Image Scan Request',
  }

  const createProps = {
    items: createItems,
    action: registryCreateAction.bind(null, props.history)
  }

  return <ListPage canCreate={true} createProps={createProps} ListComponent={ExternalRegistries} rowFilters={filters} kind={kind} {...props} />;
});

const RepositoriesTab: React.FC<RepositoriesTabProps> = ({ obj }) => {
  const {
    metadata: { namespace },
  } = obj;

  const selector = {
    matchLabels: {
      'ext-registry': obj.metadata.name,
    },
  };
  return <RepositoriesPage showTitle={false} namespace={namespace} isExtRegistry={true} selector={selector} canCreate={false} />;
};

export const ExternalRegistriesDetailsPage: React.FC<ExternalRegistriesDetailsPageProps> = props => (
  <DetailsPage
    {...props}
    kind={kind}
    menuActions={menuActions}
    pages={[
      details(detailsPage(ExternalRegistryDetails)),
      editYaml(),
      {
        href: 'repository',
        name: 'Repository',
        component: RepositoriesTab,
      },
    ]}
  />
);

type ExternalRegistryDetailsListProps = {
  ds: K8sResourceKind;
};

type ExternalRegistryDetailsProps = {
  obj: K8sResourceKind;
};

type ExternalRegistriesDetailsPageProps = {
  match: any;
};

type RepositoriesTabProps = {
  obj: K8sResourceKind;
};
