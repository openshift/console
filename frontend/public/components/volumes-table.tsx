import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import {
  ContainerSpec,
  PodKind,
  PodTemplate,
  Volume,
  VolumeMount,
} from '../module/k8s';
import {
  getVolumeType,
  getVolumeLocation,
} from '../module/k8s/pods';
import {
  VolumeIcon,
  ResourceIcon,
  EmptyBox,
  SectionHeading,
} from './utils';

const getVolumeMountsByPermissions = (pod: PodTemplate): VolumeData[] => {
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
      const k = `${v.name}_${v.readOnly ? 'ro' : 'rw'}`;
      const mount = {container: c.name, mountPath: v.mountPath, subPath: v.subPath};
      if (k in m) {
        return m[k].mounts.push(mount);
      }
      m[k] = {mounts: [mount], name: v.name, readOnly: !!v.readOnly, volume: volumes[v.name]};
    });
  });

  return _.values(m);
};

const ContainerLink: React.FC<ContainerLinkProps> = ({name, pod}) => <span className="co-resource-item co-resource-item--inline">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;
ContainerLink.displayName = 'ContainerLink';

const VolumeRow: React.FC<VolumeRowProps> = ({value, pod}) => {
  const kind = _.get(getVolumeType(value.volume), 'id', '');
  const loc = getVolumeLocation(value.volume);
  const name = value.name;
  const permission = value.readOnly ? 'Read-only' : 'Read/Write';

  return <div>
    {value.mounts.map((m: Mount, i: number) => <React.Fragment key={i}>
      <div className="row">
        <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">{name}</div>
        <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7 co-break-all co-select-to-copy">{_.get(m, 'mountPath', '-')} </div>
        <div className={classNames('col-lg-2 col-md-2 col-sm-3 hidden-xs co-break-all', { 'co-select-to-copy': _.get(m, 'subPath') })}>
          {_.get(m, 'subPath', '-')}
        </div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
          <VolumeIcon kind={kind} />
          <span className="co-break-word">{loc && ` (${loc})`}</span>
        </div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{permission}</div>
        <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
          { _.get(pod, 'kind') === 'Pod'
            ? <ContainerLink name={m.container} pod={pod as PodKind} />
            : <div>{m.container}</div>
          }
        </div>
      </div>
    </React.Fragment>)}
  </div>;
};
VolumeRow.displayName = 'VolumeRow';

export const VolumesTable: React.FC<VolumesTableProps> = ({podTemplate, heading}) => (
  <React.Fragment>
    {heading && <SectionHeading text={heading} />}
    {_.isEmpty(podTemplate.spec.volumes)
      ? <EmptyBox label="Volumes" />
      : (
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Name</div>
            <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">Mount Path</div>
            <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">SubPath</div>
            <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Type</div>
            <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Permissions</div>
            <div className="col-lg-2 hidden-md hidden-sm hidden-xs">Utilized By</div>
          </div>
          <div className="co-m-table-grid__body">
            {getVolumeMountsByPermissions(podTemplate).map((v, i) => <VolumeRow key={i} value={v} pod={podTemplate} />)}
          </div>
        </div>
      )}
  </React.Fragment>
);
VolumesTable.displayName = 'VolumesTable';

type Mount = {
  container: string;
} & VolumeMount;

type VolumeData = {
  name: string;
  readOnly: boolean;
  volume: Volume;
  mounts: Mount[];
};

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};

type VolumeRowProps = {
  pod: PodKind | PodTemplate;
  value: VolumeData;
};

type VolumesTableProps = {
  podTemplate: PodKind | PodTemplate;
  heading?: string;
};
