import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { BanIcon } from '@patternfly/react-icons';

import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import {
  CRDVersion,
  CustomResourceDefinitionKind,
  getLatestVersionForCRD,
  K8sKind,
  referenceForCRD,
} from '../module/k8s';
import { CustomResourceDefinitionModel } from '../models';
import { Conditions } from './conditions';
import { resourceListPages } from './resource-pages';
import { DefaultPage } from './default-resource';
import { GreenCheckCircleIcon } from '@console/shared';

const { common } = Kebab.factory;

const crdInstancesPath = (crd: CustomResourceDefinitionKind) =>
  _.get(crd, 'spec.scope') === 'Namespaced'
    ? `/k8s/all-namespaces/${referenceForCRD(crd)}`
    : `/k8s/cluster/${referenceForCRD(crd)}`;

const instances = (kind: K8sKind, obj: CustomResourceDefinitionKind) => ({
  label: 'View Instances',
  href: crdInstancesPath(obj),
});

const menuActions: KebabAction[] = [
  instances,
  ...Kebab.getExtensionsActionsForKind(CustomResourceDefinitionModel),
  ...common,
];

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const CRDTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'spec.names.kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Group',
      sortField: 'spec.group',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Version',
      sortField: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Namespaced',
      sortField: 'spec.scope',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Established',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
CRDTableHeader.displayName = 'CRDTableHeader';

const isEstablished = (conditions: any[]) => {
  const condition = _.find(conditions, (c) => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = (crd: CustomResourceDefinitionKind) => crd.spec.scope === 'Namespaced';

const Established: React.FC<{ crd: CustomResourceDefinitionKind }> = ({ crd }) => {
  return crd.status && isEstablished(crd.status.conditions) ? (
    <span>
      <GreenCheckCircleIcon alt="true" />
    </span>
  ) : (
    <span>
      <BanIcon alt="false" />
    </span>
  );
};

const CRDVersionList: React.FC<CRDVersionProps> = ({ crdVersions }) => (
  <div className="table-responsive">
    <table className="co-m-table-grid co-m-table-grid--bordered table">
      <thead className="co-m-table-grid__head">
        <tr>
          <td>Name</td>
          <td>Served</td>
          <td>Storage</td>
        </tr>
      </thead>
      <tbody className="co-m-table-grid__body">
        <>
          {_.map(crdVersions, (version) => (
            <tr className="co-resource-list__item">
              <td>{version.name}</td>
              <td>{version.served.toString()}</td>
              <td>{version.storage.toString()}</td>
            </tr>
          ))}
        </>
      </tbody>
    </table>
  </div>
);

const CRDTableRow: RowFunction<CustomResourceDefinitionKind> = ({
  obj: crd,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={crd.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <span className="co-resource-item">
          <ResourceLink
            kind="CustomResourceDefinition"
            name={crd.metadata.name}
            namespace={crd.metadata.namespace}
            displayName={_.get(crd, 'spec.names.kind')}
          />
        </span>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {crd.spec.group}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {getLatestVersionForCRD(crd.spec.versions, crd.spec.version)}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{namespaced(crd) ? 'Yes' : 'No'}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Established crd={crd} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
      </TableData>
    </TableRow>
  );
};

const Details: React.FC<{ obj: CustomResourceDefinitionKind }> = ({ obj: crd }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Custom Resource Definition Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary showPodSelector={false} showNodeSelector={false} resource={crd} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Established</dt>
                <dd>
                  <Established crd={crd} />
                </dd>
                <DetailsItem label="Group" obj={crd} path="spec.group" />
                <DetailsItem label="Version" obj={crd} path="spec.version" />
                <DetailsItem label="Scope" obj={crd} path="spec.scope" />
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={crd.status.conditions} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Versions" />
        <CRDVersionList crdVersions={crd.spec.versions} />
      </div>
    </>
  );
};

const Instances: React.FC<InstancesProps> = ({ obj, namespace }) => {
  const crdKind = referenceForCRD(obj);
  const componentLoader = resourceListPages.get(crdKind, () => Promise.resolve(DefaultPage));
  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={namespace ? namespace : undefined}
      kind={crdKind}
      showTitle={false}
      autoFocus={false}
    />
  );
};

export const CustomResourceDefinitionsList: React.FC<CustomResourceDefinitionsListProps> = (
  props,
) => (
  <Table
    {...props}
    aria-label="Custom Resource Definitions"
    Header={CRDTableHeader}
    Row={CRDTableRow}
    defaultSortField="spec.names.kind"
    virtualize
  />
);

export const CustomResourceDefinitionsPage: React.FC<CustomResourceDefinitionsPageProps> = (
  props,
) => (
  <ListPage
    {...props}
    ListComponent={CustomResourceDefinitionsList}
    kind="CustomResourceDefinition"
    canCreate={true}
  />
);
export const CustomResourceDefinitionsDetailsPage: React.FC<CustomResourceDefinitionsDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    kind="CustomResourceDefinition"
    menuActions={menuActions}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      { name: 'Instances', href: 'instances', component: Instances },
    ]}
  />
);

export type CustomResourceDefinitionsListProps = {};

export type CustomResourceDefinitionsPageProps = {};

type InstancesProps = {
  obj: CustomResourceDefinitionKind;
  namespace: string;
};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';

type CustomResourceDefinitionsDetailsPageProps = {
  match: any;
};

export type CRDVersionProps = {
  crdVersions: CRDVersion[];
};
