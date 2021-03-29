import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { AsyncComponent, DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { RegistryModel, NotaryModel } from '../../models/hypercloud';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { RepositoriesPage } from './repository';
import { Resources } from './resources';
import { scanningModal } from './modals';
import { withRouter, match } from 'react-router-dom';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(RegistryModel), ...Kebab.factory.common, Kebab.factory.ModifyScanning];

const kind = RegistryModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-xl'), Kebab.columnClass];

const RegistryTableHeader = (t?: TFunction) => {
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
      sortField: 'status.serverURL',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('SINGLE:MSG_IMAGEREGISTRIES_CREATEFORM_DIV2_29'),
      sortField: 'status.capacity',
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

RegistryTableHeader.displayName = 'RegistryTableHeader';

const RegistryTableRow: RowFunction<K8sResourceKind> = ({ obj: registry, index, key, style }) => {
  return (
    <TableRow id={registry.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={registry.metadata.name} namespace={registry.metadata.namespace} title={registry.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={registry.metadata.namespace} title={registry.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{registry?.status?.serverURL}</TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <Status status={registry?.status?.phase} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{registry?.status?.capacity}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={registry.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={registry} />
      </TableData>
    </TableRow>
  );
};

export const RegistryDetailsList: React.FC<RegistryDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();

  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('COMMON:MSG_MAIN_TABLEHEADER_3')} obj={ds} path="status.phase">
        <Status status={ds?.status?.phase} />
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_3')} obj={ds} path="spec.image">
        {ds.spec.image}
      </DetailsItem>
      <DetailsItem label={t('SINGLE:MSG_IMAGEREGISTRIES_CREATEFORM_DIV2_29')} obj={ds} path="status.capacity">
        {ds.status.capacity}
      </DetailsItem>
      <DetailsItem label={t('SINGLE:MSG_IMAGEREGISTRIES_IMAGEREGISTRYDETAILS_TABDETAILS_1')} obj={ds} path="status.serverURL">
        {ds.status.serverURL}
      </DetailsItem>
    </dl>
  );
};

const RegistryDetails: React.FC<RegistryDetailsProps> = ({ obj: registry }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(registry, t) })} />
        {/* <SectionHeading text="aaaa" /> */}
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={registry} />
          </div>
          <div className="col-lg-6">
            <RegistryDetailsList ds={registry} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_DETAILS_TABDETAILS_RESOURCES_1')}`} />
        <Resources conditions={registry.status.conditions} registry={registry.metadata.name} namespace={registry.metadata.namespace} />
      </div>
    </>
  );
};

const { details, editYaml } = navFactory;

export const Registries: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Registries" Header={RegistryTableHeader.bind(null, t)} Row={RegistryTableRow} virtualize />;
};

const registryStatusReducer = (registry: any): string => {
  return registry?.status?.phase;
};

const filters = t => [
  {
    filterGroupName: t('COMMON:MSG_COMMON_FILTER_10'),
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
      scanningModal({ kind: 'Registry', ns, showNs: true });
      break;
    case 'generic':
      history.push('/');
      if (allNS === 'all-namespaces') {
        history.push('/k8s/ns/default/registries/~new');
      } else {
        history.push(`/k8s/ns/${ns}/registries/~new`);
      }
      break;
  }
};

export const RegistriesPage = withRouter(props => {
  const { t } = useTranslation();

  const createItems = {
    generic: 'Create Registry',
    scan: 'Image Scan Request',
  };

  const createProps = {
    items: createItems,
    action: registryCreateAction.bind(null, props.history),
  };

  return <ListPage title={t('COMMON:MSG_LNB_MENU_187')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_187') })} canCreate={true} createProps={createProps} ListComponent={Registries} rowFilters={filters.bind(null, t)()} kind={kind} {...props} />;
});

const RepositoriesTab: React.FC<RepositoriesTabProps> = ({ obj }) => {
  const {
    metadata: { namespace },
  } = obj;

  const selector = {
    matchLabels: {
      registry: obj.metadata.name,
    },
  };
  return <RepositoriesPage showTitle={false} namespace={namespace} selector={selector} canCreate={false} />;
};

export const NotaryLoader: React.FC<NotaryLoaderProps> = props => {
  return <AsyncComponent loader={() => import('./notary').then(c => c.NotariesDetailsPage)} kind={'Notary'} kindObj={NotaryModel} name={decodeURIComponent(props.obj.metadata.name)} namespace={props.obj.metadata.namespace} match={props.match} />;
};

export const RegistriesDetailsPage: React.FC<RegistriesDetailsPageProps> = props => (
  <DetailsPage
    {...props}
    kind={kind}
    menuActions={menuActions}
    pages={[
      details(detailsPage(RegistryDetails)),
      editYaml(),
      {
        href: 'repository',
        name: 'Repository',
        component: RepositoriesTab,
      },
      {
        href: 'notary',
        name: 'Notary',
        component: detailsPage(NotaryLoader),
      },
    ]}
  />
);

type RegistryDetailsListProps = {
  ds: K8sResourceKind;
};

type RegistryDetailsProps = {
  obj: K8sResourceKind;
};

type RegistriesDetailsPageProps = {
  match: any;
};

type RepositoriesTabProps = {
  obj: K8sResourceKind;
};

type NotaryLoaderProps = {
  obj: K8sResourceKind;
  match: match<any>;
};
