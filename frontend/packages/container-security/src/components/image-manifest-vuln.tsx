import * as React from 'react';
import { EmptyState, EmptyStateVariant, Tooltip, EmptyStateHeader } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import { DefaultList } from '@console/internal/components/default-resource';
import {
  MultiListPage,
  Table,
  TableData,
  DetailsPage,
  ListPage,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { ContainerLink } from '@console/internal/components/pod';
import {
  ResourceLink,
  ExternalLink,
  navFactory,
  SectionHeading,
  ResourceSummary,
  DetailsItem,
  Firehose,
  FirehoseResult,
  Loading,
} from '@console/internal/components/utils';
import { referenceForModel, PodKind, ContainerStatus } from '@console/internal/module/k8s';
import { EmptyStateResourceBadge, GreenCheckCircleIcon } from '@console/shared/';
import { vulnPriority, totalFor, priorityFor } from '../const';
import { ImageManifestVulnModel } from '../models';
import { ImageManifestVuln } from '../types';
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
export const affectedPodsCount = (obj: ImageManifestVuln) =>
  Object.keys(obj.status?.affectedPods ?? {}).length;

export const highestSeverityIndex = (obj: ImageManifestVuln) =>
  priorityFor(obj.status?.highestSeverity).index;

export const ImageManifestVulnDetails: React.FC<ImageManifestVulnDetailsProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('container-security~Image Manifest Vulnerabilities details')} />
        <ImageVulnerabilityToggleGroup obj={props.obj} />
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={props.obj} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem
                label={t('container-security~Registry')}
                obj={props.obj}
                path="spec.image"
              />
              <DetailsItem
                label={t('container-security~Manifest')}
                obj={props.obj}
                path="obj.spec.manifest"
              >
                <ExternalLink
                  text={shortenHash(props.obj.spec.manifest)}
                  href={quayURLFor(props.obj)}
                />
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
      <div className="cs-imagevulnerabilitieslist__wrapper">
        <ImageVulnerabilitiesList {...props} />
      </div>
    </>
  );
};

export const AffectedPods: React.FC<AffectedPodsProps> = (props) => {
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

export const ImageManifestVulnDetailsPage: React.FC = () => {
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

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'co-break-word'),
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
];

export const ImageManifestVulnTableRow: React.FC<RowFunctionArgs<ImageManifestVuln>> = ({
  obj,
}) => {
  const { name, namespace } = obj.metadata;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(ImageManifestVulnModel)}
          name={name}
          namespace={namespace}
          displayName={shortenImage(obj.spec.image)}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {obj.status?.highestSeverity ? (
          <>
            <ExclamationTriangleIcon color={priorityFor(obj.status.highestSeverity).color.value} />
            &nbsp;{obj.status.highestSeverity}
          </>
        ) : (
          DASH
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{affectedPodsCount(obj)}</TableData>
      <TableData className={tableColumnClasses[4]}>{obj.status?.fixableCount || 0}</TableData>
      <TableData className={tableColumnClasses[5]}>{totalCount(obj)}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ExternalLink text={shortenHash(obj.spec.manifest)} href={quayURLFor(obj)} />
      </TableData>
    </>
  );
};

export const ImageManifestVulnTableHeader = (t: TFunction) => () => [
  {
    title: t('container-security~Image name'),
    sortField: 'spec.image',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: t('container-security~Namespace'),
    sortField: 'metadata.namespace',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
    id: 'namespace',
  },
  {
    title: t('container-security~Highest severity'),
    sortFunc: 'highestSeverityOrder',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: t('container-security~Affected Pods'),
    props: { className: tableColumnClasses[3] },
    transforms: [sortable],
    sortFunc: 'affectedPodsOrder',
  },
  {
    title: t('container-security~Fixable'),
    sortField: 'status.fixableCount',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: t('container-security~Total'),
    sortFunc: 'totalOrder',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  },
  {
    title: t('container-security~Manifest'),
    props: { className: tableColumnClasses[6] },
    transforms: [sortable],
    sortField: 'spec.manifest',
  },
];

export const ImageManifestVulnList: React.FC<ImageManifestVulnListProps> = (props) => {
  const { t } = useTranslation();
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.lg}>
      <EmptyStateHeader
        titleText={
          <>
            <EmptyStateResourceBadge model={ImageManifestVulnModel} />
            {t('container-security~No Image vulnerabilities found')}
          </>
        }
        headingLevel="h4"
      />
    </EmptyState>
  );

  return (
    <Table
      {...props}
      customSorts={{
        totalOrder: totalCount,
        affectedPodsOrder: affectedPodsCount,
        highestSeverityOrder: highestSeverityIndex,
      }}
      aria-label={t('container-security~Image Manifest Vulnerabilities')}
      Header={ImageManifestVulnTableHeader(t)}
      Row={ImageManifestVulnTableRow}
      EmptyMsg={EmptyMsg}
      virtualize
    />
  );
};

export const ImageManifestVulnPage: React.FC<ImageManifestVulnPageProps> = (props) => {
  const { t } = useTranslation();
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
      title={t('container-security~Image Manifest Vulnerabilities')}
      textFilter="image-name"
      canCreate={false}
      showTitle={showTitle}
      nameFilterPlaceholder={t('container-security~Search by image name...')}
      hideNameLabelFilters={hideNameLabelFilters}
      ListComponent={ImageManifestVulnList}
    />
  );
};

export const ProjectImageManifestVulnListPage: React.FC<ImageManifestVulnPageProps> = (props) => (
  <ImageManifestVulnPage {...props} showTitle={false} hideNameLabelFilters={false} />
);

const podKey = (pod: PodKind) => [pod.metadata.namespace, pod.metadata.name].join('/');

export const ContainerVulnerabilities: React.FC<ContainerVulnerabilitiesProps> = (props) => {
  const { t } = useTranslation();
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

  return (
    <div className="co-m-pane__body">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-md-3">{t('container-security~Container')}</div>
          <div className="col-md-4">{t('container-security~Image')}</div>
          <div className="col-md-2">
            <Tooltip content="Results provided by Quay security scanner">
              <span>{t('container-security~Security scan')}</span>
            </Tooltip>
          </div>
        </div>
        <div className="co-m-table-grid__body">
          {props.pod.status.containerStatuses.map((status) => (
            <div className="row" key={status.containerID}>
              <div className="col-md-3">
                <ContainerLink pod={props.pod} name={status.name} />
              </div>
              <div className="col-md-4 co-truncate co-nowrap co-select-to-copy">
                {props.pod.spec.containers.find((c) => c.name === status.name).image}
              </div>
              <div className="col-md-3">
                {props.loaded ? (
                  withVuln(
                    vulnFor(status),
                    (vuln) => (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <ExclamationTriangleIcon
                          color={priorityFor(_.get(vuln.status, 'highestSeverity')).color.value}
                        />
                        &nbsp;
                        <ResourceLink
                          kind={referenceForModel(ImageManifestVulnModel)}
                          name={vuln.metadata.name}
                          namespace={props.pod.metadata.namespace}
                          displayName={`${totalFor(
                            vulnPriority.findKey(
                              ({ title }) => _.get(vuln.status, 'highestSeverity') === title,
                            ),
                          )(vuln)} ${vuln.status.highestSeverity}`}
                          hideIcon
                        />
                      </span>
                    ),
                    () => (
                      <span>
                        <GreenCheckCircleIcon /> {t('container-security~No vulnerabilities found')}
                      </span>
                    ),
                  )
                ) : (
                  <div>
                    <Loading />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ImageManifestVulnPodTab: React.FC<ImageManifestVulnPodTabProps> = (props) => {
  const params = useParams();
  return (
    <Firehose
      resources={[
        {
          isList: true,
          kind: referenceForModel(ImageManifestVulnModel),
          namespace: params.ns,
          selector: {
            matchLabels: { [podKey(props.obj)]: 'true' },
          },
          prop: 'imageManifestVuln',
        },
      ]}
    >
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <ContainerVulnerabilities pod={props.obj} {...(props as any)} />
    </Firehose>
  );
};

export type ContainerVulnerabilitiesProps = {
  loaded: boolean;
  pod: PodKind;
  imageManifestVuln: FirehoseResult<ImageManifestVuln[]>;
};

export type ImageManifestVulnPageProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
  showTitle?: boolean;
  selector?: { [key: string]: string };
};

export type ImageManifestVulnListProps = {
  data: ImageManifestVuln[];
};

export type ImageManifestVulnDetailsProps = {
  obj: ImageManifestVuln;
};

export type ImageManifestVulnListTableHeaderProps = {};

export type AffectedPodsProps = {
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
