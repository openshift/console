import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  LazyActionMenu,
} from '@console/shared';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  DetailsItem,
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  detailsPage,
  navFactory,
} from './utils';
import {
  StorageClassResourceKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
} from '../module/k8s';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

export const StorageClassReference: K8sResourceKindReference = 'StorageClass';

export const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation = 'storageclass.beta.kubernetes.io/is-default-class';
export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return (
    annotations[defaultClassAnnotation] === 'true' ||
    annotations[betaDefaultStorageClassAnnotation] === 'true'
  );
};

const tableColumnClasses = [
  'pf-v6-u-w-42-on-md',
  'pf-v6-u-w-42-on-md',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-16-on-md',
  Kebab.columnClass,
];

const StorageClassDetails: React.FC<StorageClassDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('public~StorageClass details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj}>
            <DetailsItem label={t('public~Provisioner')} obj={obj} path="provisioner" />
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <DescriptionList>
            <DetailsItem label={t('public~Reclaim policy')} obj={obj} path="reclaimPolicy" />
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Default class')}</DescriptionListTerm>
              <DescriptionListDescription>
                {isDefaultClass(obj) ? t('public~True') : t('public~False')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DetailsItem
              label={t('public~Volume binding mode')}
              obj={obj}
              path="volumeBindingMode"
            />
          </DescriptionList>
        </div>
      </div>
    </PaneBody>
  );
};

const StorageClassTableRow: React.FC<RowFunctionArgs<StorageClassResourceKind>> = ({ obj }) => {
  const { t } = useTranslation();
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  return (
    <>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink kind={StorageClassReference} name={obj.metadata.name}>
          {isDefaultClass(obj) && (
            <span className="small pf-v6-u-text-color-subtle co-resource-item__help-text">
              &ndash; {t('public~Default')}
            </span>
          )}
        </ResourceLink>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {obj.provisioner}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.reclaimPolicy || '-'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const StorageClassList: React.FC = (props) => {
  const { t } = useTranslation();
  const StorageClassTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Provisioner'),
        sortField: 'provisioner',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Reclaim policy'),
        sortField: 'reclaimPolicy',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~StorageClasses')}
      Header={StorageClassTableHeader}
      Row={StorageClassTableRow}
      virtualize
    />
  );
};
StorageClassList.displayName = 'StorageClassList';

export const StorageClassPage: React.FC<StorageClassPageProps> = (props) => {
  const createProps = {
    to: '/k8s/cluster/storageclasses/~new/form',
  };
  const { t } = useTranslation();
  return (
    <ListPage
      {..._.omit(props, 'mock')}
      title={t('public~StorageClasses')}
      kind={StorageClassReference}
      ListComponent={StorageClassList}
      canCreate={true}
      filterLabel={props.filterLabel}
      createProps={createProps}
      createButtonText={t('public~Create StorageClass')}
    />
  );
};
export const StorageClassDetailsPage: React.FC = (props) => {
  const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editYaml()];
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      kind={StorageClassReference}
      customActionMenu={customActionMenu}
      pages={pages}
    />
  );
};
StorageClassDetailsPage.displayName = 'StorageClassDetailsPage';

export type StorageClassDetailsProps = {
  obj: any;
};

export type StorageClassPageProps = {
  filterLabel: string;
  namespace: string;
};
