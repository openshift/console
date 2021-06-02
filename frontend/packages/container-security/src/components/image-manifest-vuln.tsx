import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { EmptyState, EmptyStateVariant, Title, Tooltip } from '@patternfly/react-core';
import { SecurityIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { DefaultList } from '@console/internal/components/default-resource';
import {
  MultiListPage,
  Table,
  TableRow,
  TableData,
  DetailsPage,
  ListPage,
  RowFunction,
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
import { quayURLFor } from './summary';
import './image-manifest-vuln.scss';

const shortenImage = (img: string) =>
  img
    .replace('@sha256', '')
    .split('/')
    .slice(1, 3)
    .join('/');
const shortenHash = (hash: string) => hash.slice(7, 18);
export const totalCount = (obj: ImageManifestVuln) => {
  if (!obj.status) return 0;
  const { highCount = 0, mediumCount = 0, lowCount = 0, unknownCount = 0 } = obj.status;
  return highCount + mediumCount + lowCount + unknownCount;
};
export const affectedPodsCount = (obj: ImageManifestVuln) =>
  Object.keys(obj.status.affectedPods).length;

export const highestSeverityIndex = (obj: ImageManifestVuln) =>
  priorityFor(obj.status.highestSeverity).index;

export const ImageManifestVulnDetails: React.FC<ImageManifestVulnDetailsProps> = (props) => {
  const { t } = useTranslation();
  const total = props.obj.spec.features.reduce((sum, f) => sum + f.vulnerabilities.length, 0);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('container-security~Image Manifest Vulnerabilities details')} />
        <div style={{ display: 'flex' }}>
          <div className="cs-imagemanifestvuln-details__donut">
            <ChartDonut
              colorScale={vulnPriority.map((priority) => priority.color.value).toArray()}
              data={vulnPriority
                .map((priority, key) => ({
                  label: priority.title,
                  x: priority.value,
                  y: totalFor(key)(props.obj),
                }))
                .toArray()}
              title={t('container-security~{{total, number}} total', { total })}
            />
          </div>
          <div className="cs-imagemanifestvuln-details__summary">
            <h3>
              {t(
                'container-security~Quay Security Scanner has detected {{total, number}} vulnerabilities.',
                { total },
              )}
            </h3>
            <h4>
              {t(
                'container-security~Patches are available for {{fixableCount, number}} vulnerabilities.',
                {
                  fixableCount: props.obj.status.fixableCount,
                },
              )}
            </h4>
            <div className="cs-imagemanifestvuln-details__summary-list">
              {vulnPriority
                .map((v, k) =>
                  totalFor(k)(props.obj) > 0 ? (
                    <span style={{ margin: '5px' }} key={v.index}>
                      <SecurityIcon color={v.color.value} />
                      &nbsp;<strong>{totalFor(k)(props.obj)}</strong>{' '}
                      {t('container-security~{{title}} vulnerabilities', { title: v.title })}.
                    </span>
                  ) : null,
                )
                .toArray()}
            </div>
          </div>
        </div>
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
      _.keys(props.obj.status.affectedPods).includes(
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

export const ImageManifestVulnDetailsPage: React.FC<ImageManifestVulnDetailsPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  return (
    <DetailsPage
      match={props.match}
      kindObj={ImageManifestVulnModel}
      titleFunc={(obj: ImageManifestVuln) =>
        !_.isEmpty(obj) ? `${shortenImage(obj.spec.image)}@${shortenHash(obj.spec.manifest)}` : null
      }
      name={props.match.params.name}
      namespace={props.match.params.ns}
      kind={referenceForModel(ImageManifestVulnModel)}
      menuActions={[]}
      pages={[
        navFactory.details(ImageManifestVulnDetails),
        navFactory.editYaml(),
        {
          href: 'pods',
          name: t('container-security~Affected Pods'),
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

export const ImageManifestVulnTableRow: RowFunction<ImageManifestVuln> = ({
  obj,
  index,
  key,
  style,
}) => {
  const { name, namespace } = obj.metadata;
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
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
        {_.get(obj.status, 'highestSeverity') ? (
          <>
            <SecurityIcon color={priorityFor(obj.status.highestSeverity).color.value} />
            &nbsp;{obj.status.highestSeverity}
          </>
        ) : (
          <Loading />
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{affectedPodsCount(obj)}</TableData>
      <TableData className={tableColumnClasses[4]}>{obj.status.fixableCount || 0}</TableData>
      <TableData className={tableColumnClasses[5]}>{totalCount(obj)}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ExternalLink text={shortenHash(obj.spec.manifest)} href={quayURLFor(obj)} />
      </TableData>
    </TableRow>
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
    <EmptyState variant={EmptyStateVariant.large}>
      <Title headingLevel="h4" size="lg">
        <EmptyStateResourceBadge model={ImageManifestVulnModel} />
        {t('container-security~No Image vulnerabilities found')}
      </Title>
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
  const { showTitle = true, hideNameLabelFilters = true } = props;
  const namespace = props.namespace || props.match?.params?.ns || props.match?.params?.name;
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
                        <SecurityIcon
                          color={priorityFor(_.get(vuln.status, 'highestSeverity')).color.value}
                        />
                        &nbsp;
                        <ResourceLink
                          kind={referenceForModel(ImageManifestVulnModel)}
                          name={vuln.metadata.name}
                          namespace={props.pod.metadata.namespace}
                          title={vuln.metadata.uid}
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
  return (
    <Firehose
      resources={[
        {
          isList: true,
          kind: referenceForModel(ImageManifestVulnModel),
          namespace: props.match.params.ns,
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

export type ImageManifestVulnDetailsPageProps = {
  match: match<{ ns: string; name: string }>;
};

export type ImageManifestVulnPageProps = {
  namespace?: string;
  match?: match<{ ns?: string; name?: string }>;
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
  match: match<{ ns: string; name: string }>;
  obj: PodKind;
};

ImageManifestVulnPage.displayName = 'ImageManifestVulnPage';
ImageManifestVulnList.displayName = 'ImageManifestVulnList';
AffectedPods.displayName = 'AffectedPods';
ImageManifestVulnPodTab.displayName = 'ImageManifestVulnPodTab';
ContainerVulnerabilities.displayName = 'ContainerVulnerabilities';
