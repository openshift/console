import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  TableRow,
  TableData,
  Table,
  ListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink } from '@console/internal/components/utils';
import { VolumeSnapshotClassModel } from '@console/internal/models';
import { referenceForModel, VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import { getAnnotations } from '@console/shared';

const tableColumnClasses = [
  '', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // Driver
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // Deletion Policy
  Kebab.columnClass,
];
const defaultSnapshotClassAnnotation: string = 'snapshot.storage.kubernetes.io/is-default-class';
export const isDefaultSnapshotClass = (volumeSnapshotClass: VolumeSnapshotClassKind) =>
  getAnnotations(volumeSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const Row: RowFunction<VolumeSnapshotClassKind> = ({ obj, index, style, key }) => {
  const { name } = obj?.metadata || {};
  const { deletionPolicy, driver } = obj || {};
  return (
    <TableRow id={obj?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink name={name} kind={referenceForModel(VolumeSnapshotClassModel)}>
          {isDefaultSnapshotClass(obj) && (
            <span className="small text-muted co-resource-item__help-text">&ndash; Default</span>
          )}
        </ResourceLink>
      </TableData>
      <TableData className={tableColumnClasses[1]}>{driver}</TableData>
      <TableData className={tableColumnClasses[2]}>{deletionPolicy}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotClassModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </TableRow>
  );
};

const VolumeSnapshotClassTable: React.FC = (props) => {
  const { t } = useTranslation();
  const Header = () => {
    return [
      {
        title: t('console-app~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('console-app~Driver'),
        sortField: 'driver',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('console-app~Deletion policy'),
        sortField: 'deletionPolicy',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };

  return <Table {...props} aria-label={VolumeSnapshotClassModel.label} Header={Header} Row={Row} />;
};

const VolumeSnapshotClassPage: React.FC = (props) => (
  <ListPage
    {...props}
    ListComponent={VolumeSnapshotClassTable}
    kind={referenceForModel(VolumeSnapshotClassModel)}
    canCreate
  />
);

export default VolumeSnapshotClassPage;
