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
import { Table } from './factory';
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

const VolumesTableRows = ({ componentProps: { data } }) => {
  return _.map(data, (volume: RowVolumeData) => {
    const { container, mountPath, name, readOnly, resource, subPath, volumeDetail } = volume;
    const pod = getPodTemplate(resource);
    return [
      {
        title: name,
        props: {
          className: volumeRowColumnClasses[0],
          'data-test-volume-name-for': name,
        },
      },
      {
        title: mountPath,
        props: {
          classname: volumeRowColumnClasses[1],
          'data-test-mount-path-for': name,
        },
      },
      {
        title: subPath || <span className="text-muted">No subpath</span>,
        props: {
          classname: volumeRowColumnClasses[2],
        },
      },
      {
        title: <VolumeType volume={volumeDetail} namespace={resource.metadata.namespace} />,
        props: {
          classname: volumeRowColumnClasses[3],
        },
      },
      {
        title: readOnly ? 'Read-only' : 'Read/Write',
        props: {
          classname: volumeRowColumnClasses[4],
        },
      },
      {
        title:
          _.get(pod, 'kind') === 'Pod' ? (
            <ContainerLink name={container} pod={pod as PodKind} />
          ) : (
            container
          ),
        props: {
          classname: volumeRowColumnClasses[5],
        },
      },
      {
        title: (
          <VolumeKebab
            actions={menuActions}
            kind={resource.kind}
            resource={resource}
            rowVolumeData={volume}
          />
        ),
        props: {
          classname: volumeRowColumnClasses[6],
        },
      },
    ];
  });
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
          Rows={VolumesTableRows}
          virtualize={false}
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
