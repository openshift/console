import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import {
  ContainerSpec,
  getVolumeType,
  getVolumeLocation,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  PodKind,
  PodTemplate,
  Volume,
  VolumeMount,
} from '../module/k8s';
import { asAccessReview, EmptyBox, Kebab, KebabOption, VolumeIcon, ResourceIcon, SectionHeading } from './utils';
import { Table, TableData, TableRow } from './factory';
import { sortable } from '@patternfly/react-table';
import { removeVolumeModal } from './modals';
import {connectToModel} from '../kinds';

const removeVolume = (kind: K8sKind, obj: K8sResourceKind, volume: RowVolumeData): KebabOption => {
  return {
    label: 'Remove Volume',
    callback: () => removeVolumeModal({
      kind,
      resource: obj,
      volume,
    }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  };
};

const menuActions = [removeVolume];

const getPodTemplate = (resource: K8sResourceKind): PodTemplate => {
  return resource.kind === 'Pod' ? resource as PodKind : resource.spec.template;
};

const getRowVolumeData = (resource: K8sResourceKind): RowVolumeData[] => {
  const pod: PodTemplate = getPodTemplate(resource);
  if (!pod || !pod.spec || !pod.spec.volumes) {
    return [];
  }

  const m = {};
  const volumes = (pod.spec.volumes || []).reduce((p, v: Volume) => {
    p[v.name] = v;
    return p;
  }, {});

  _.forEach(pod.spec.containers, (c: ContainerSpec) => {
    _.forEach(c.volumeMounts, (v: VolumeMount) => {
      const k = `${v.name}_${v.readOnly ? 'ro' : 'rw'}_${v.mountPath}`;
      const mount = {container: c.name, mountPath: v.mountPath, subPath: v.subPath};
      m[k] = {name: v.name, readOnly: !!v.readOnly, volumeDetail: volumes[v.name],
        container: mount.container, mountPath: mount.mountPath, subPath: mount.subPath,resource};
    });
  });
  return _.values(m);
};

const ContainerLink: React.FC<ContainerLinkProps> = ({name, pod}) => <span className="co-resource-item co-resource-item--inline">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;
ContainerLink.displayName = 'ContainerLink';

const volumeRoColumnClasses = [
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
      title: 'Name', sortField: 'name', transforms: [sortable],
      props: { className: volumeRoColumnClasses[0]},
    },
    {
      title: 'Mount Path', sortField: 'mountPath', transforms: [sortable],
      props: { className: volumeRoColumnClasses[1]},
    },
    {
      title: 'SubPath', sortField: 'subPath', transforms: [sortable],
      props: { className: volumeRoColumnClasses[2]},
    },
    {
      title: 'Type',
      props: { className: volumeRoColumnClasses[3]},
    },
    {
      title: 'Permissions', sortField: 'readOnly', transforms: [sortable],
      props: { className: volumeRoColumnClasses[4]},
    },
    {
      title: 'Utilized By', sortField: 'container', transforms: [sortable],
      props: { className: volumeRoColumnClasses[5]},
    },
    {
      title: '',
      props: { className: volumeRoColumnClasses[6]},
    },
  ];
};
VolumesTableHeader.displayName = 'VolumesTableHeader';

const VolumesTableRow = ({obj: volume, index, key, style}) => {
  const type = _.get(getVolumeType(volume.volumeDetail), 'id', '');
  const loc = getVolumeLocation(volume.volumeDetail);
  const name = volume.name;
  const permission = volume.readOnly ? 'Read-only' : 'Read/Write';
  const { resource } = volume;
  const pod: PodTemplate = getPodTemplate(resource);

  return (
    <TableRow id={`${name}-${volume.mountPath}`} index={index} trKey={key} style={style}>
      <TableData className={volumeRoColumnClasses[0]}>{name}</TableData>
      <TableData className={classNames(volumeRoColumnClasses[1], 'co-break-word')}>{volume.mountPath}</TableData>
      <TableData className={volumeRoColumnClasses[2]}>{volume.subPath}</TableData>
      <TableData className={volumeRoColumnClasses[3]}>
        <VolumeIcon kind={type} />
        <span className="co-break-word">{loc && ` (${loc})`}</span>
      </TableData>
      <TableData className={volumeRoColumnClasses[4]}>{permission}</TableData>
      <TableData className={volumeRoColumnClasses[5]}>
        {_.get(pod, 'kind') === 'Pod' ? <ContainerLink name={volume.container} pod={pod as PodKind} /> : <div>{volume.container}</div>}
      </TableData>
      <TableData className={volumeRoColumnClasses[6]}>
        <VolumeKebab actions={menuActions} kind={resource.kind} resource={resource} rowVolumeData={volume} />
      </TableData>
    </TableRow>
  );
};
VolumesTableRow.displayName = 'VolumesTableRow';

export const VolumesTable = props => {
  const { resource, ...tableProps } = props;
  const data: RowVolumeData[] = getRowVolumeData(resource);
  const pod: PodTemplate = getPodTemplate(resource);
  return <React.Fragment>
    {props.heading && <SectionHeading text={props.heading} />}
    {_.isEmpty(pod.spec.volumes)
      ? <EmptyBox label="Volumes" />
      : (
        <Table {...tableProps} aria-label="Volumes" loaded={true} label={props.heading} data={data} Header={VolumesTableHeader} Row={VolumesTableRow} virtualize />
      )}
  </React.Fragment>;
};

VolumesTable.displayName = 'VolumesTable';

const VolumeKebab = connectToModel((props: VolumeKebabProps) => {
  const {actions, kindObj, resource, isDisabled, rowVolumeData} = props;
  if (!kindObj || kindObj.kind === 'Pod') {
    return null;
  }
  const options = actions.map(b => b(kindObj, resource, rowVolumeData));
  return <Kebab
    options={options}
    isDisabled={isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')}
  />;
});

type VolumeKebabAction = (kind: K8sKind, obj: K8sResourceKind, rowVolumeData: RowVolumeData) => KebabOption;
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

