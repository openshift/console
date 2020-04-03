import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import {
  ContainerSpec,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  PodKind,
  PodTemplate,
  Volume,
  VolumeMount,
} from '../module/k8s';
import {
  asAccessReview,
  EmptyBox,
  Kebab,
  KebabOption,
  ResourceIcon,
  SectionHeading,
  VolumeType,
} from './utils';
import { Table, TableData, TableRow, RowFunction } from './factory';
import { sortable } from '@patternfly/react-table';
import { removeVolumeModal } from './modals';
import { connectToModel } from '../kinds';

const removeVolume = (kind: K8sKind, obj: K8sResourceKind, volume: RowVolumeData): KebabOption => {
  return {
    label: 'Remove Volume',
    callback: () =>
      removeVolumeModal({
        kind,
        resource: obj,
        volume,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  };
};

const menuActions = [removeVolume];

const getPodTemplate = (resource: K8sResourceKind): PodTemplate => {
  return resource.kind === 'Pod' ? (resource as PodKind) : resource.spec.template;
};

const anyContainerWithVolumeMounts = (containers: ContainerSpec[]) => {
  return !!_.findKey(containers, 'volumeMounts');
};

const getRowVolumeData = (resource: K8sResourceKind): RowVolumeData[] => {
  const pod: PodTemplate = getPodTemplate(resource);
  if (_.isEmpty(pod.spec.volumes) && !anyContainerWithVolumeMounts(pod.spec.containers)) {
    return [];
  }

  const data: RowVolumeData[] = [];
  const volumes = (pod.spec.volumes || []).reduce((p, v: Volume) => {
    p[v.name] = v;
    return p;
  }, {});

  _.forEach(pod.spec.containers, (c: ContainerSpec) => {
    _.forEach(c.volumeMounts, (v: VolumeMount) => {
      data.push({
        name: v.name,
        readOnly: !!v.readOnly,
        volumeDetail: volumes[v.name],
        container: c.name,
        mountPath: v.mountPath,
        subPath: v.subPath,
        resource,
      });
    });
  });
  return data;
};

const ContainerLink: React.FC<ContainerLinkProps> = ({ name, pod }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>
      {name}
    </Link>
  </span>
);
ContainerLink.displayName = 'ContainerLink';

const volumeRowColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-5'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-7'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const VolumesTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'name',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[0] },
    },
    {
      title: 'Mount Path',
      sortField: 'mountPath',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[1] },
    },
    {
      title: 'SubPath',
      sortField: 'subPath',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[2] },
    },
    {
      title: 'Type',
      props: { className: volumeRowColumnClasses[3] },
    },
    {
      title: 'Permissions',
      sortField: 'readOnly',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[4] },
    },
    {
      title: 'Utilized By',
      sortField: 'container',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[5] },
    },
    {
      title: '',
      props: { className: volumeRowColumnClasses[6] },
    },
  ];
};
VolumesTableHeader.displayName = 'VolumesTableHeader';

const VolumesTableRow: RowFunction = ({ obj: volume, index, key, style }) => {
  const { name, resource, readOnly, mountPath, subPath, volumeDetail } = volume;
  const permission = readOnly ? 'Read-only' : 'Read/Write';
  const pod: PodTemplate = getPodTemplate(resource);

  return (
    <TableRow id={`${name}-${mountPath}`} index={index} trKey={key} style={style}>
      <TableData className={volumeRowColumnClasses[0]} data-test-id="name">
        {name}
      </TableData>
      <TableData
        className={classNames(volumeRowColumnClasses[1], 'co-break-word')}
        data-test-id="path"
      >
        {mountPath}
      </TableData>
      <TableData className={volumeRowColumnClasses[2]}>{subPath}</TableData>
      <TableData className={volumeRowColumnClasses[3]}>
        <VolumeType volume={volumeDetail} namespace={resource.metadata.namespace} />
      </TableData>
      <TableData className={volumeRowColumnClasses[4]}>{permission}</TableData>
      <TableData className={volumeRowColumnClasses[5]}>
        {_.get(pod, 'kind') === 'Pod' ? (
          <ContainerLink name={volume.container} pod={pod as PodKind} />
        ) : (
          <div>{volume.container}</div>
        )}
      </TableData>
      <TableData className={volumeRowColumnClasses[6]}>
        <VolumeKebab
          actions={menuActions}
          kind={resource.kind}
          resource={resource}
          rowVolumeData={volume}
        />
      </TableData>
    </TableRow>
  );
};

export const VolumesTable = (props) => {
  const { resource, ...tableProps } = props;
  const data: RowVolumeData[] = getRowVolumeData(resource);
  const pod: PodTemplate = getPodTemplate(resource);
  return (
    <>
      {props.heading && <SectionHeading text={props.heading} />}
      {_.isEmpty(pod.spec.volumes) && !anyContainerWithVolumeMounts(pod.spec.containers) ? (
        <EmptyBox label="Volumes" />
      ) : (
        <Table
          {...tableProps}
          aria-label="Volumes"
          loaded={true}
          label={props.heading}
          data={data}
          Header={VolumesTableHeader}
          Row={VolumesTableRow}
          virtualize
        />
      )}
    </>
  );
};

VolumesTable.displayName = 'VolumesTable';

const VolumeKebab = connectToModel((props: VolumeKebabProps) => {
  const { actions, kindObj, resource, isDisabled, rowVolumeData } = props;
  if (!kindObj || kindObj.kind === 'Pod') {
    return null;
  }
  const options = actions.map((b) => b(kindObj, resource, rowVolumeData));
  return (
    <Kebab
      options={options}
      isDisabled={
        isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')
      }
    />
  );
});

type VolumeKebabAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  rowVolumeData: RowVolumeData,
) => KebabOption;
type VolumeKebabProps = {
  kindObj: K8sKind;
  actions: VolumeKebabAction[];
  kind: K8sResourceKindReference;
  resource: K8sResourceKind;
  isDisabled?: boolean;
  rowVolumeData: RowVolumeData;
};

export type RowVolumeData = {
  name: string;
  readOnly: boolean;
  volumeDetail: Volume;
  container: string;
  mountPath: string;
  subPath?: string;
  resource: K8sResourceKind;
};

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};
