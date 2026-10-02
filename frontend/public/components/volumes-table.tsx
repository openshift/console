/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC } from 'react';
import { useMemo } from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { connectToModel } from '../kinds';
import type {
  ContainerSpec,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  PodKind,
  PodTemplate,
  Volume,
  VolumeMount,
} from '../module/k8s';
import { useRemoveModalLauncher } from './modals/remove-volume-modal';
import type { ModalCallback } from './modals/types';
import { SectionHeading } from './utils/headings';
import type { KebabOption } from './utils/kebab';
import { Kebab } from './utils/kebab';
import { asAccessReview } from './utils/rbac';
import { ResourceIcon } from './utils/resource-icon';
import { EmptyBox } from './utils/status-box';
import { VolumeType } from './utils/volume-type';

const removeVolume = (
  removeVolumeModal: ModalCallback,
  kind: K8sKind,
  obj: K8sResourceKind,
): KebabOption => ({
  // t('public~Remove volume')
  labelKey: 'public~Remove volume',
  callback: () => removeVolumeModal(),
  accessReview: asAccessReview(kind, obj, 'patch'),
});

const getPodTemplate = (resource: K8sResourceKind): PodTemplate =>
  resource.kind === 'Pod' ? (resource as PodKind) : resource.spec.template;

const anyContainerWithVolumeMounts = (containers: ContainerSpec[]) =>
  !!_.findKey(containers, 'volumeMounts');

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

const ContainerLink: FC<ContainerLinkProps> = ({ name, pod }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>
      {name}
    </Link>
  </span>
);
ContainerLink.displayName = 'ContainerLink';

const useVolumeColumns = (): {
  columns: ConsoleDataViewColumn<RowVolumeData>[];
} => {
  const { t } = useTranslation('public');
  const columns = useMemo(
    () => [
      {
        type: 'name' as const,
        id: 'name',
        title: t('Name'),
        sort: 'name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'mountPath',
        title: t('Mount path'),
        sort: 'mountPath',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'subPath',
        title: t('SubPath'),
        sort: 'subPath',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'type',
        title: t('Type'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'permissions',
        title: t('Permissions'),
        sort: 'readOnly',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'utilizedBy',
        title: t('Utilized by'),
        sort: 'container',
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};

export const getVolumeDataViewRows: GetDataViewRows<RowVolumeData> = (data, columns) =>
  data.map(({ obj: volume }) => {
    const { container, mountPath, name, readOnly, resource, subPath, volumeDetail } = volume;
    const pod = getPodTemplate(resource);
    const podVolume = pod.spec?.volumes?.find((v) => name === v.name);
    const podVolumeIsReadOnly = podVolume
      ? Object.values(podVolume).some((v) => v.readOnly === 'true')
      : false;
    const rowCells = {
      name: {
        cell: name,
        props: {
          'data-test': `volume-name-${name}`,
          'data-test-volume-name-for': name,
        },
      },
      mountPath: {
        cell: mountPath,
        props: {
          'data-test': `mount-path-${name}`,
          'data-test-mount-path-for': name,
        },
      },
      subPath: {
        cell: subPath || (
          <span className="pf-v6-u-text-color-subtle">{i18next.t('public~No subpath')}</span>
        ),
      },
      type: {
        cell: <VolumeType volume={volumeDetail} namespace={resource.metadata.namespace} />,
        // VolumeType renders a ResourceLink. Without nowrap on the cell itself the resource name
        // breaks one character per line whenever the column is narrow.
        props: { modifier: 'nowrap' as const },
      },
      permissions: {
        cell:
          readOnly || podVolumeIsReadOnly
            ? i18next.t('public~Read-only')
            : i18next.t('public~Read/Write'),
      },
      utilizedBy: {
        // `getPodTemplate` returns the resource itself for a Pod, and `spec.template` otherwise,
        // so only a Pod's template can be linked to a container.
        cell:
          resource.kind === 'Pod' ? (
            <ContainerLink name={container} pod={pod as PodKind} />
          ) : (
            container
          ),
      },
      actions: {
        cell: <VolumeKebab kind={resource.kind} resource={resource} rowVolumeData={volume} />,
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const getObjectMetadata = (volume: RowVolumeData): ResourceMetadata => ({ name: volume.name });

export const VolumesTable: FC<VolumesTableProps> = ({ resource, heading }) => {
  const { t } = useTranslation('public');
  const { columns } = useVolumeColumns();
  const data: RowVolumeData[] = getRowVolumeData(resource);
  const pod: PodTemplate = getPodTemplate(resource);

  return (
    <>
      {heading && <SectionHeading text={heading} />}
      {_.isEmpty(pod.spec.volumes) && !anyContainerWithVolumeMounts(pod.spec.containers) ? (
        <EmptyBox label={t('Volumes')} />
      ) : (
        <ConsoleDataView<RowVolumeData>
          id="console.ui~v1~VolumeTable"
          label={t('Volumes')}
          data={data}
          loaded
          columns={columns}
          getDataViewRows={getVolumeDataViewRows}
          getObjectMetadata={getObjectMetadata}
          hideLabelFilter
        />
      )}
    </>
  );
};

VolumesTable.displayName = 'VolumesTable';

const VolumeKebab = connectToModel((props: VolumeKebabProps) => {
  const { kindObj, resource, isDisabled, rowVolumeData } = props;
  const removeVolumeModalLauncher: ModalCallback = useRemoveModalLauncher({
    kind: kindObj,
    resource,
    volume: rowVolumeData,
  });

  const actions = [removeVolume];

  if (!kindObj || kindObj.kind === 'Pod') {
    return null;
  }

  const options = actions.map((b) => b(removeVolumeModalLauncher, kindObj, resource));
  return (
    <Kebab
      options={options}
      isDisabled={
        isDisabled !== undefined ? isDisabled : resource?.metadata?.deletionTimestamp?.length > 0
      }
    />
  );
});

type VolumesTableProps = {
  resource: K8sResourceKind;
  heading?: string;
};

type VolumeKebabProps = {
  kindObj: K8sKind;
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
