import type { FC } from 'react';
import { useMemo } from 'react';
import { Alert, DescriptionList, Grid, GridItem, Tooltip } from '@patternfly/react-core';
import { RhUiWarningFillIcon } from '@patternfly/react-icons';
import { Table as PfTable, Thead, Th, Tbody, Td, Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { DefaultList } from '@console/internal/components/default-resource';
import { MultiListPage, DetailsPage, ListPage } from '@console/internal/components/factory';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ContainerLink } from '@console/internal/components/pod';
import {
  ResourceLink,
  navFactory,
  SectionHeading,
  ResourceSummary,
  DetailsItem,
  Loading,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { PodKind, ContainerStatus } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { GreenCheckCircleIcon } from '@console/shared/src/components/status/icons';
import { totalFor, priorityFor } from '../const';
import { ImageManifestVulnModel } from '../models';
import type { ImageManifestVuln } from '../types';
import ImageVulnerabilitiesList from './ImageVulnerabilitiesList';
import ImageVulnerabilityToggleGroup from './ImageVulnerabilityToggleGroup';
import { quayURLFor } from './summary';
import './image-manifest-vuln.scss';

const shortenImage = (img: string) =>
  (img ?? '').replace('@sha256', '').split('/').slice(1, 3).join('/');
const shortenHash = (hash: string): string => (hash ?? '').slice(7, 18);
export const totalCount = (obj: ImageManifestVuln) => {
  if (!obj.status) return 0;
  const { highCount = 0, mediumCount = 0, lowCount = 0, unknownCount = 0 } = obj.status;
  return highCount + mediumCount + lowCount + unknownCount;
};
const affectedPodsCount = (obj: ImageManifestVuln) =>
  Object.keys(obj.status?.affectedPods ?? {}).length;

const highestSeverityIndex = (obj: ImageManifestVuln) =>
  priorityFor(obj.status?.highestSeverity).index;

const ImageManifestVulnDetails: FC<ImageManifestVulnDetailsProps> = (props) => {
  const { t } = useTranslation('container-security');
  const queryURL = quayURLFor(props.obj);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('Image Manifest Vulnerabilities details')} />
        <ImageVulnerabilityToggleGroup obj={props.obj} />
      </PaneBody>
      <PaneBody>
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={props.obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('Registry')} obj={props.obj} path="spec.image" />

              {queryURL && (
                <DetailsItem label={t('Manifest')} obj={props.obj} path="obj.spec.manifest">
                  <ExternalLink text={shortenHash(props.obj.spec.manifest)} href={queryURL} />
                </DetailsItem>
              )}
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <div className="cs-imagevulnerabilitieslist__wrapper">
        <ImageVulnerabilitiesList {...props} />
      </div>
    </>
  );
};

const AffectedPods: FC<AffectedPodsProps> = (props) => {
  const affectedPodsFor = (pods: PodKind[]) =>
    pods.filter((p) =>
      _.keys(props.obj.status?.affectedPods ?? {}).includes(
        [p.metadata.namespace, p.metadata.name].join('/'),
      ),
    );

  return (
    <ListPage
      kind="Pod"
      namespace={props.obj.metadata.namespace}
      canCreate={false}
      showTitle={false}
      ListComponent={(listProps) => (
        <DefaultList {...listProps} data={affectedPodsFor(listProps.data)} />
      )}
    />
  );
};

export const ImageManifestVulnDetailsPage: FC = () => {
  const params = useParams();
  return (
    <DetailsPage
      kindObj={ImageManifestVulnModel}
      titleFunc={(obj: ImageManifestVuln) => {
        const image = shortenImage(obj?.spec?.image);
        const hash = obj?.spec?.manifest ? `@${shortenHash(obj.spec.manifest)}` : '';
        return image ? `${image}${hash}` : null;
      }}
      name={params.name}
      namespace={params.ns}
      kind={referenceForModel(ImageManifestVulnModel)}
      menuActions={[]}
      pages={[
        navFactory.details(ImageManifestVulnDetails),
        navFactory.editYaml(),
        {
          href: 'pods',
          // t('container-security~Affected Pods')
          nameKey: 'container-security~Affected Pods',
          component: AffectedPods,
        },
      ]}
    />
  );
};

const useImageManifestVulnColumns = (): {
  columns: ConsoleDataViewColumn<ImageManifestVuln>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('container-security');
  const { getResizableProps, resetAllColumnWidths } =
    useColumnWidthSettings(ImageManifestVulnModel);
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Image name'),
        sort: 'spec.image',
        props: { ...getNameColumnProps(), modifier: 'nowrap' as const },
      },
      {
        id: 'namespace',
        resizableProps: getResizableProps('namespace'),
        title: t('Namespace'),
        sort: 'metadata.namespace',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'highestSeverity',
        resizableProps: getResizableProps('highestSeverity'),
        title: t('Highest severity'),
        // Order by how urgent the severity is rather than alphabetically.
        sort: (data, direction) => data.sort(sortResourceByValue(direction, highestSeverityIndex)),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'affectedPods',
        resizableProps: getResizableProps('affectedPods'),
        title: t('Affected Pods'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, affectedPodsCount)),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'fixable',
        resizableProps: getResizableProps('fixable'),
        title: t('Fixable'),
        sort: 'status.fixableCount',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'total',
        resizableProps: getResizableProps('total'),
        title: t('Total'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, totalCount)),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'manifest',
        resizableProps: getResizableProps('manifest'),
        title: t('Manifest'),
        sort: 'spec.manifest',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};

export const getImageManifestVulnDataViewRows: GetDataViewRows<ImageManifestVuln> = (
  data,
  columns,
) =>
  data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const queryURL = quayURLFor(obj);
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={referenceForModel(ImageManifestVulnModel)}
            name={name}
            namespace={namespace}
            displayName={shortenImage(obj.spec.image)}
          />
        ),
        props: getNameCellProps(name),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={namespace} /> },
      highestSeverity: {
        cell: obj.status?.highestSeverity ? (
          <>
            <RhUiWarningFillIcon color={priorityFor(obj.status.highestSeverity).color.value} />
            &nbsp;{obj.status.highestSeverity}
          </>
        ) : (
          DASH
        ),
      },
      affectedPods: { cell: affectedPodsCount(obj) },
      fixable: { cell: obj.status?.fixableCount || 0 },
      total: { cell: totalCount(obj) },
      manifest: {
        cell: queryURL ? (
          <ExternalLink text={shortenHash(obj.spec.manifest)} href={queryURL} />
        ) : (
          <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">-</span>
        ),
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

/** The resource name is a digest, so match the name filter against the image it refers to. */
const getObjectMetadata = (imageManifestVuln: ImageManifestVuln): ResourceMetadata => ({
  name: imageManifestVuln.spec.image,
  labels: imageManifestVuln.metadata.labels,
});

const ImageManifestVulnList: FC<ImageManifestVulnListProps> = (props) => {
  const { t } = useTranslation('container-security');
  const { columns, resetAllColumnWidths } = useImageManifestVulnColumns();

  return (
    <ConsoleDataView<ImageManifestVuln>
      {...props}
      label={t('Image Manifest Vulnerabilities')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getImageManifestVulnDataViewRows}
      getObjectMetadata={getObjectMetadata}
      showNamespaceOverride={props.showNamespaceOverride}
      hideNameLabelFilters={props.hideNameLabelFilters}
      hideColumnManagement
      isResizable
      resetAllColumnWidths={resetAllColumnWidths}
    />
  );
};

export const ImageManifestVulnPage: FC<ImageManifestVulnPageProps> = (props) => {
  const { t } = useTranslation('container-security');
  const params = useParams();
  const { showTitle = true, hideNameLabelFilters = true } = props;
  const namespace = props.namespace || params?.ns || params?.name;
  return (
    <MultiListPage
      {...props}
      namespace={namespace}
      resources={[
        {
          kind: referenceForModel(ImageManifestVulnModel),
          namespace,
          namespaced: true,
          prop: 'imageManifestVuln',
        },
      ]}
      flatten={(resources) => _.get(resources.imageManifestVuln, 'data', [])}
      title={t('Image Manifest Vulnerabilities')}
      textFilter="image-name"
      canCreate={false}
      showTitle={showTitle}
      nameFilterPlaceholder={t('Search by image name...')}
      hideNameLabelFilters={hideNameLabelFilters}
      ListComponent={ImageManifestVulnList}
      omitFilterToolbar
    />
  );
};

export const ProjectImageManifestVulnListPage: FC<ImageManifestVulnPageProps> = (props) => (
  <ImageManifestVulnPage {...props} showTitle={false} hideNameLabelFilters={false} />
);

const podKey = (pod: PodKind) => [pod.metadata.namespace, pod.metadata.name].join('/');

const ContainerVulnerabilities: FC<ContainerVulnerabilitiesProps> = (props) => {
  const { t } = useTranslation('container-security');
  const { loaded, loadError } = props.imageManifestVuln;

  const vulnFor = (containerStatus: ContainerStatus) =>
    _.get(props.imageManifestVuln, 'data', []).find(
      (imv) =>
        imv.status.affectedPods[podKey(props.pod)].some(
          (id) => containerStatus.containerID === id,
        ) || containerStatus.imageID.includes(imv.spec.manifest),
    );

  const withVuln = (
    vuln: ImageManifestVuln,
    exists: (vuln: ImageManifestVuln) => JSX.Element,
    absent: () => JSX.Element,
  ) => (vuln !== undefined ? exists(vuln) : absent());

  if (loadError) {
    return (
      <PaneBody>
        <Alert isInline variant="danger" title={t('Unable to load vulnerability data')}>
          {loadError instanceof Error ? loadError.message : String(loadError)}
        </Alert>
      </PaneBody>
    );
  }

  if (!loaded) {
    return (
      <PaneBody>
        <Loading />
      </PaneBody>
    );
  }

  return (
    <PaneBody>
      <PfTable gridBreakPoint="">
        <Thead>
          <Tr>
            <Th width={30}>{t('Container')}</Th>
            <Th width={50}>{t('Image')}</Th>
            <Th width={20}>
              <Tooltip content="Results provided by Quay security scanner">
                <span>{t('Security scan')}</span>
              </Tooltip>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {props.pod.status.containerStatuses.map((status) => (
            <Tr key={status.containerID}>
              <Td>
                <ContainerLink pod={props.pod} name={status.name} />
              </Td>
              <Td className="co-select-to-copy" modifier="breakWord">
                {props.pod.spec.containers.find((c) => c.name === status.name).image}
              </Td>
              <Td>
                {withVuln(
                  vulnFor(status),
                  (vuln) => (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <RhUiWarningFillIcon
                        color={priorityFor(_.get(vuln.status, 'highestSeverity')).color.value}
                      />
                      &nbsp;
                      <ResourceLink
                        kind={referenceForModel(ImageManifestVulnModel)}
                        name={vuln.metadata.name}
                        namespace={props.pod.metadata.namespace}
                        displayName={`${totalFor(
                          priorityFor(_.get(vuln.status, 'highestSeverity')).value,
                        )(vuln)} ${vuln.status.highestSeverity}`}
                        hideIcon
                      />
                    </span>
                  ),
                  () => (
                    <span>
                      <GreenCheckCircleIcon /> {t('No vulnerabilities found')}
                    </span>
                  ),
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </PfTable>
    </PaneBody>
  );
};

export const ImageManifestVulnPodTab: FC<ImageManifestVulnPodTabProps> = (props) => {
  const params = useParams();
  const [imageManifestVuln, loaded, loadError] = useK8sWatchResource<ImageManifestVuln[]>({
    isList: true,
    kind: referenceForModel(ImageManifestVulnModel),
    namespace: params.ns,
    selector: {
      matchLabels: { [podKey(props.obj)]: 'true' },
    },
  });

  return (
    <ContainerVulnerabilities
      pod={props.obj}
      imageManifestVuln={{ data: imageManifestVuln, loaded, loadError }}
    />
  );
};

type ContainerVulnerabilitiesProps = {
  pod: PodKind;
  imageManifestVuln: {
    data: ImageManifestVuln[];
    loaded: boolean;
    loadError?: unknown;
  };
};

export type ImageManifestVulnPageProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
  showTitle?: boolean;
  selector?: { [key: string]: string };
};

type ImageManifestVulnListProps = {
  data: ImageManifestVuln[];
  loaded?: boolean;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
};

type ImageManifestVulnDetailsProps = {
  obj: ImageManifestVuln;
};

type AffectedPodsProps = {
  obj: ImageManifestVuln;
};

export type ImageManifestVulnPodTabProps = {
  obj: PodKind;
};

ImageManifestVulnPage.displayName = 'ImageManifestVulnPage';
ImageManifestVulnList.displayName = 'ImageManifestVulnList';
AffectedPods.displayName = 'AffectedPods';
ImageManifestVulnPodTab.displayName = 'ImageManifestVulnPodTab';
ContainerVulnerabilities.displayName = 'ContainerVulnerabilities';
