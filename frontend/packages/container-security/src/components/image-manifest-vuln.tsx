import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { SecurityIcon } from '@patternfly/react-icons';
import {
  MultiListPage,
  Table,
  TableRow,
  TableData,
  DetailsPage,
  ListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { GreenCheckCircleIcon } from '@console/shared/';
import { referenceForModel, PodKind, ContainerStatus } from '@console/internal/module/k8s';
import { match } from 'react-router';
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
  MsgBox,
} from '@console/internal/components/utils';
import { ChartDonut } from '@patternfly/react-charts';
import { DefaultList } from '@console/internal/components/default-resource';
import { vulnPriority, totalFor, priorityFor } from '../const';
import { ImageManifestVuln, Feature, Vulnerability } from '../types';
import { ImageManifestVulnModel } from '../models';
import { quayURLFor } from './summary';
import './image-manifest-vuln.scss';
import { ContainerLink } from '@console/internal/components/pod';

const shortenImage = (img: string) =>
  img
    .replace('@sha256', '')
    .split('/')
    .slice(1, 3)
    .join('/');
const shortenHash = (hash: string) => hash.slice(7, 18);

export const ImageVulnerabilityRow: React.FC<ImageVulnerabilityRowProps> = (props) => {
  return (
    <div className="row">
      <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
        <ExternalLink text={props.vulnerability.name} href={props.vulnerability.link} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-5 col-xs-6">
        <SecurityIcon color={priorityFor(props.vulnerability.severity).color.value} />
        &nbsp;{props.vulnerability.severity}
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">{props.packageName}</div>
      <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{props.currentVersion}</div>
      <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
        {props.vulnerability.fixedby || '-'}
      </div>
    </div>
  );
};

export const ImageVulnerabilitiesTable: React.FC<ImageVulnerabilitiesTableProps> = (props) => {
  const vulnerabilites = _.sortBy(
    _.flatten(
      props.features.map((feature) =>
        feature.vulnerabilities.map((vulnerability) => ({ feature, vulnerability })),
      ),
    ),
    (v) => priorityFor(v.vulnerability.severity).index,
  );

  return (
    <>
      <SectionHeading text="Vulnerabilities" />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">Vulnerability</div>
          <div className="col-lg-2 col-md-2 col-sm-5 col-xs-6">Severity</div>
          <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">Package</div>
          <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Current Version</div>
          <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Fixed in Version</div>
        </div>
        <div className="co-m-table-grid__body">
          {vulnerabilites.map(({ feature, vulnerability }) => (
            <ImageVulnerabilityRow
              key={`${feature.name}-${vulnerability.name}`}
              vulnerability={vulnerability}
              packageName={feature.name}
              currentVersion={feature.version}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export const ImageManifestVulnDetails: React.FC<ImageManifestVulnDetailsProps> = (props) => {
  const total = props.obj.spec.features.reduce((sum, f) => sum + f.vulnerabilities.length, 0);

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Image Manifest Vuln Details" />
        <div style={{ display: 'flex' }}>
          <div className="imagemanifestvuln-details__donut">
            <ChartDonut
              colorScale={vulnPriority.map((priority) => priority.color.value).toArray()}
              data={vulnPriority
                .map((priority, key) => ({
                  label: priority.title,
                  x: priority.value,
                  y: totalFor(key)(props.obj),
                }))
                .toArray()}
              title={`${total} total`}
            />
          </div>
          <div className="imagemanifestvuln-details__summary">
            <h3>Quay Security Scanner has detected {total} vulnerabilities.</h3>
            <h4>Patches are available for {props.obj.status.fixableCount} vulnerabilities.</h4>
            <div className="imagemanifestvuln-details__summary-list">
              {vulnPriority
                .map((v, k) =>
                  totalFor(k)(props.obj) > 0 ? (
                    <span style={{ margin: '5px' }} key={v.index}>
                      <SecurityIcon color={v.color.value} />
                      &nbsp;<strong>{totalFor(k)(props.obj)}</strong> {v.title} vulnerabilities.
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
              <DetailsItem label="Registry" obj={props.obj} path="spec.image" />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <ImageVulnerabilitiesTable features={props.obj.spec.features} />
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
          name: 'Affected Pods',
          component: AffectedPods,
        },
      ]}
    />
  );
};

// TODO(alecmerdler): Fix classes here to ensure responsiveness
const tableColumnClasses = ['', '', '', '', '', ''];

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
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
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
      <TableData className={tableColumnClasses[3]}>
        {Object.keys(obj.status.affectedPods).length}
      </TableData>
      <TableData className={tableColumnClasses[4]}>{obj.status.fixableCount || 0}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <ExternalLink text={shortenHash(obj.spec.manifest)} href={quayURLFor(obj)} />
      </TableData>
    </TableRow>
  );
};

export const ImageManifestVulnTableHeader = () => [
  {
    title: 'Image Name',
    sortField: 'spec.image',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Namespace',
    sortField: 'metadata.namespace',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Highest Severity',
    sortField: 'status.highestSeverity',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Affected Pods',
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Fixable',
    sortField: 'status.fixableCount',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: 'Manifest',
    props: { className: tableColumnClasses[5] },
  },
];

export const ImageManifestVulnList: React.FC<ImageManifestVulnListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Image Vulnerabilities Found" detail="" />;

  return (
    <Table
      {...props}
      aria-label="Image Manifest Vulnerabilities"
      Header={ImageManifestVulnTableHeader}
      Row={ImageManifestVulnTableRow}
      EmptyMsg={EmptyMsg}
      virtualize
    />
  );
};

export const ImageManifestVulnPage: React.FC<ImageManifestVulnPageProps> = (props) => {
  const namespace = props.match.params?.ns;

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
      title="Image Manifest Vulnerabilities"
      canCreate={false}
      showTitle
      hideToolbar
      ListComponent={ImageManifestVulnList}
    />
  );
};

const podKey = (pod: PodKind) => [pod.metadata.namespace, pod.metadata.name].join('/');

export const ContainerVulnerabilities: React.FC<ContainerVulnerabilitiesProps> = (props) => {
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
          <div className="col-md-3">Container</div>
          <div className="col-md-4">Image</div>
          <div className="col-md-2">
            <Tooltip content="Results provided by Quay security scanner">
              <span>Security Scan</span>
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
                        <GreenCheckCircleIcon />
                        &nbsp;No vulnerabilities found
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
  match?: match<{ ns?: string }>;
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

export type ImageVulnerabilitiesTableProps = {
  features: Feature[];
};

export type ImageVulnerabilityRowProps = {
  vulnerability: Vulnerability;
  currentVersion: string;
  packageName: string;
};

export type ImageManifestVulnPodTabProps = {
  match: match<{ ns: string; name: string }>;
  obj: PodKind;
};

ImageManifestVulnPage.displayName = 'ImageManifestVulnPage';
ImageManifestVulnList.displayName = 'ImageManifestVulnList';
AffectedPods.displayName = 'AffectedPods';
ImageVulnerabilitiesTable.displayName = 'ImageVulnerabilitiesTable';
ImageVulnerabilityRow.displayName = 'ImageVulnerabilityRow';
ImageManifestVulnPodTab.displayName = 'ImageManifestVulnPodTab';
ContainerVulnerabilities.displayName = 'ContainerVulnerabilities';
