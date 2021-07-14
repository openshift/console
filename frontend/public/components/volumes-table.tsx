import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
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
    // t('public~Remove volume')
    labelKey: 'public~Remove volume',
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
  'pf-u-w-25-on-2xl',
  'pf-u-w-25-on-2xl',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

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
          className: volumeRowColumnClasses[1],
          'data-test-mount-path-for': name,
        },
      },
      {
        title: subPath || <span className="text-muted">{i18next.t('public~No subpath')}</span>,
        props: {
          className: volumeRowColumnClasses[2],
        },
      },
      {
        title: <VolumeType volume={volumeDetail} namespace={resource.metadata.namespace} />,
        props: {
          className: volumeRowColumnClasses[3],
        },
      },
      {
        title: readOnly ? i18next.t('public~Read-only') : i18next.t('public~Read/Write'),
        props: {
          className: volumeRowColumnClasses[4],
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
          className: volumeRowColumnClasses[5],
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
          className: volumeRowColumnClasses[6],
        },
      },
    ];
  });
};

export const VolumesTable = (props) => {
  const { t } = useTranslation();
  const { resource, ...tableProps } = props;
  const data: RowVolumeData[] = getRowVolumeData(resource);
  const pod: PodTemplate = getPodTemplate(resource);
  const VolumesTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[0] },
    },
    {
      title: t('public~Mount path'),
      sortField: 'mountPath',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[1] },
    },
    {
      title: t('public~SubPath'),
      sortField: 'subPath',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[2] },
    },
    {
      title: t('public~Type'),
      props: { className: volumeRowColumnClasses[3] },
    },
    {
      title: t('public~Permissions'),
      sortField: 'readOnly',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[4] },
    },
    {
      title: t('public~Utilized by'),
      sortField: 'container',
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[5] },
    },
    {
      title: '',
      props: { className: volumeRowColumnClasses[6] },
    },
  ];

  return (
    <>
      {props.heading && <SectionHeading text={props.heading} />}
      {_.isEmpty(pod.spec.volumes) && !anyContainerWithVolumeMounts(pod.spec.containers) ? (
        <EmptyBox label={t('public~Volumes')} />
      ) : (
        <Table
          {...tableProps}
          aria-label={t('public~Volumes')}
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
      isDisabled={isDisabled !== undefined ? isDisabled : resource?.metadata?.deletionTimestamp}
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
