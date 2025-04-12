import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import {
  Kebab,
  LabelList,
  navFactory,
  ResourceKebab,
  SectionHeading,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';
import { PersistentVolumeModel } from '../models';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(PersistentVolumeModel), ...common];

const PVStatus = ({ pv }) => (
  <Status status={pv.metadata.deletionTimestamp ? 'Terminating' : pv.status.phase} />
);

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const kind = 'PersistentVolume';

const PVTableRow = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <PVStatus pv={obj} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(obj, 'spec.claimRef.name') ? (
          <ResourceLink
            kind="PersistentVolumeClaim"
            name={obj.spec.claimRef.name}
            namespace={obj.spec.claimRef.namespace}
            title={obj.spec.claimRef.name}
          />
        ) : (
          <div className="pf-v6-u-text-color-subtle">{t('public~No claim')}</div>
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.capacity.storage', '-')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          actions={menuActions}
          kind={kind}
          resource={obj}
          terminatingTooltip={t(
            'public~The corresponding PersistentVolumeClaim must be deleted first.',
          )}
        />
      </TableData>
    </>
  );
};

const Details = ({ obj: pv }) => {
  const { t } = useTranslation();
  const storageClassName = _.get(pv, 'spec.storageClassName');
  const pvcName = _.get(pv, 'spec.claimRef.name');
  const namespace = _.get(pv, 'spec.claimRef.namespace');
  const storage = _.get(pv, 'spec.capacity.storage');
  const accessModes = _.get(pv, 'spec.accessModes');
  const volumeMode = _.get(pv, 'spec.volumeMode');
  const reclaimPolicy = _.get(pv, 'spec.persistentVolumeReclaimPolicy');
  const nfsExport = _.get(pv, 'spec.csi.volumeAttributes.share');
  return (
    <PaneBody>
      <SectionHeading text={t('public~PersistentVolume details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pv}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Reclaim policy')}</DescriptionListTerm>
              <DescriptionListDescription>{reclaimPolicy}</DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <PVStatus pv={pv} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {storage && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Capacity')}</DescriptionListTerm>
                <DescriptionListDescription>{storage}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {!_.isEmpty(accessModes) && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Access modes')}</DescriptionListTerm>
                <DescriptionListDescription>{accessModes.join(', ')}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Volume mode')}</DescriptionListTerm>
              <DescriptionListDescription>
                {volumeMode || t('public~Filesystem')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~StorageClass')}</DescriptionListTerm>
              <DescriptionListDescription>
                {storageClassName ? (
                  <ResourceLink kind="StorageClass" name={storageClassName} />
                ) : (
                  t('public~None')
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {pvcName && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~PersistentVolumeClaim')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceLink kind="PersistentVolumeClaim" name={pvcName} namespace={namespace} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {nfsExport && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~NFS-export')}</DescriptionListTerm>
                <DescriptionListDescription>{nfsExport}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </div>
      </div>
    </PaneBody>
  );
};

export const PersistentVolumesList = (props) => {
  const { t } = useTranslation();
  const PVTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Claim'),
        sortField: 'spec.claimRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Capacity'),
        sortFunc: 'pvStorage',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Created'),
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
  return (
    <Table
      {...props}
      aria-label={t('public~PersistentVolumes')}
      Header={PVTableHeader}
      Row={PVTableRow}
      virtualize
    />
  );
};

export const PersistentVolumesPage = (props) => (
  <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />
);
export const PersistentVolumesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);
