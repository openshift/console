import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import {
  getVolumeType,
  getVolumeLocation,
  getVolumeMountPermissions,
  getVolumeMountsByPermissions,
} from '../module/k8s/pods';
import {
  VolumeIcon,
  ResourceIcon,
  EmptyBox,
  SectionHeading,
} from './utils';

const ContainerLink = ({name, pod}) => <span className="co-resource-link co-resource-link--inline">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;

const Volume = ({volumeMounts, pod}) => {
  const kind = _.get(getVolumeType(volumeMounts.volume), 'id', '');
  const loc = getVolumeLocation(volumeMounts.volume);
  const name = volumeMounts.name;
  const mountPermissions = getVolumeMountPermissions(volumeMounts);

  return <div>
    {volumeMounts.mounts.map((m, i) => <React.Fragment key={i}>
      <div className="row">
        <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">{name}</div>
        <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7 co-break-word">{_.get(m, 'mountPath', '-')} </div>
        <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs co-break-word">{_.get(m, 'subPath', '-')} </div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
          <VolumeIcon kind={kind} />
          <span className="co-break-word">{loc && ` (${loc})`}</span>
        </div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{mountPermissions}</div>
        <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
          { pod.kind === 'Pod' ?
            <ContainerLink name={m.container} pod={pod} />
            :
            <div>{m.container}</div>
          }
        </div>
      </div>
    </React.Fragment>)}
  </div>;
};

export const MountedVolumes: React.SFC<MountedVolumesProps> = ({podTemplate, heading}) => (
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
            {getVolumeMountsByPermissions(podTemplate).map((v, i) => <Volume key={i} volumeMounts={v} pod={podTemplate} />)}
          </div>
        </div>
      )}
  </React.Fragment>
);

/* eslint-disable no-undef */

export type MountedVolumesProps = {
  podTemplate: any,
  heading?: string;
};
/* eslint-enable no-undef */
