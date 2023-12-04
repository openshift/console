import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';

import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { ImageStreamTagModel } from '../models';
import { DetailsPage, Table } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceSummary } from './utils';
import { humanizeBinaryBytes } from './utils/units';
import { ExampleDockerCommandPopover } from './image-stream';
import { ImageStreamTimeline } from './image-stream-timeline';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { sortable } from '@patternfly/react-table';

const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';
const ImageStreamsReference: K8sResourceKindReference = 'ImageStream';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(ImageStreamTagModel), ...common];

// Splits a name/value pair separated by an `=`
const splitEnv = (nameValue: string) => {
  // Use this method instead of `String.split()` so we only split on the first `=`.
  const i = nameValue.indexOf('=');
  if (i === -1) {
    return {
      name: nameValue,
      value: '',
    };
  }

  return {
    name: nameValue.substring(0, i),
    value: nameValue.substring(i + 1),
  };
};

const supportedPlatformColumnClasses = [
  'pf-m-hidden pf-m-visible-on-sm',
  'pf-m-hidden pf-m-visible-on-sm',
  'pf-m-hidden pf-m-visible-on-lg',
];

const SupportedPlatformsTableRows = ({ componentProps: { data } }) => {
  return _.map(data, (submanifest: RowSupportedPlatformData) => {
    const { os, architecture, digest } = submanifest;
    return [
      {
        title: os,
        props: {
          className: supportedPlatformColumnClasses[0],
        },
      },
      {
        title: architecture,
        props: {
          className: supportedPlatformColumnClasses[1],
        },
      },
      {
        title: digest,
        props: {
          className: supportedPlatformColumnClasses[2],
        },
      },
    ];
  });
};

export const SupportedPlatformsTable = (props) => {
  const { t } = useTranslation();
  const { submanifests, policy, ...tableProps } = props;

  const SupportedPlatformsTableHeader = () => [
    {
      title: t('public~OS'),
      sortField: 'os',
      transforms: [sortable],
      props: { className: supportedPlatformColumnClasses[0] },
    },
    {
      title: t('public~Architecture'),
      sortField: 'architecture',
      transforms: [sortable],
      props: { className: supportedPlatformColumnClasses[1] },
    },
    {
      title: t('public~Identifier'),
      sortField: 'digest',
      transforms: [sortable],
      props: { className: supportedPlatformColumnClasses[2] },
    },
  ];

  if (!policy || submanifests.length === 0) {
    // If the policy does not support Manifest Lists, it exits.
    // or the Manifest List is empty
    return null;
  }

  return (
    <>
      <div className="co-m-pane__body-group">
        {props.heading && <SectionHeading text={props.heading} />}
        <Table
          {...tableProps}
          aria-label={t('public~Supported Platforms')}
          loaded={true}
          label={props.heading}
          data={submanifests}
          Header={SupportedPlatformsTableHeader}
          Rows={SupportedPlatformsTableRows}
          virtualize={false}
        />
      </div>
    </>
  );
};

SupportedPlatformsTable.displayName = 'SupportedPlatformsTable';

export const ImageStreamTagsDetails: React.SFC<ImageStreamTagsDetailsProps> = ({
  obj: imageStreamTag,
  imageStream,
}) => {
  const config = _.get(imageStreamTag, 'image.dockerImageMetadata.Config', {});
  const labels = config.Labels || {};
  // Convert to an array of objects with name and value properties, then sort the array for display.
  const labelsArray = _.map(labels, (value, name) => ({ name, value }));
  const sortedLabels = _.sortBy(labelsArray, 'name');

  // Sort the submanifests by os,architecture
  const submanifests = _.get(imageStreamTag, 'image.dockerImageManifests', {});
  const sortedSubmanifests = _.sortBy(submanifests, ['os', 'architecture']);
  const importPolicyPreserveOriginal =
    _.get(imageStreamTag, 'tag.importPolicy.importMode', {}) === 'PreserveOriginal';

  const entrypoint = (config.Entrypoint || []).join(' ');
  const cmd = (config.Cmd || []).join(' ');
  const exposedPorts = _.keys(config.ExposedPorts).join(', ');
  const size = _.get(imageStreamTag, 'image.dockerImageMetadata.Size');
  const humanizedSize = _.isFinite(size) && humanizeBinaryBytes(size).string;
  const architecture = _.get(imageStreamTag, 'image.dockerImageMetadata.Architecture');
  const tagName = _.get(imageStreamTag, 'tag.name');

  const { t } = useTranslation();

  return (
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-md-6 col-sm-12">
            <SectionHeading text={t('public~ImageStreamTag details')} />
            <ResourceSummary resource={imageStreamTag}>
              {labels.name && <dt>{t('public~Image name')}</dt>}
              {labels.name && <dd>{labels.name}</dd>}
              {labels.summary && <dt>{t('public~Summary')}</dt>}
              {labels.summary && <dd>{labels.summary}</dd>}
              {humanizedSize && <dt>{t('public~Size')}</dt>}
              {humanizedSize && <dd>{humanizedSize}</dd>}
            </ResourceSummary>
            <ExampleDockerCommandPopover imageStream={imageStream} tag={tagName} />
          </div>
          <div className="col-md-6 col-sm-12">
            <SectionHeading text={t('public~Configuration')} />
            <dl className="co-m-pane__details">
              {entrypoint && <dt>{t('public~Entrypoint')}</dt>}
              {entrypoint && <dd className="co-break-word">{entrypoint}</dd>}
              {cmd && <dt>{t('public~Command')}</dt>}
              {cmd && <dd className="co-break-word">{cmd}</dd>}
              {config.WorkingDir && <dt>{t('public~Working dir')}</dt>}
              {config.WorkingDir && <dd className="co-break-all">{config.WorkingDir}</dd>}
              {exposedPorts && <dt>{t('public~Exposed ports')}</dt>}
              {exposedPorts && <dd className="co-break-word">{exposedPorts}</dd>}
              {config.User && <dt>{t('public~User')}</dt>}
              {config.User && <dd>{config.User}</dd>}
              {architecture && <dt>{t('public~Architecture')}</dt>}
              {architecture && <dd>{architecture}</dd>}
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <SectionHeading text={t('public~Image labels')} />
        {_.isEmpty(sortedLabels) ? (
          <span className="text-muted">{t('public~No labels')}</span>
        ) : (
          <div className="co-table-container">
            <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
              <thead className="pf-v5-c-table__thead">
                <tr className="pf-v5-c-table__tr">
                  <th className="pf-v5-c-table__th">{t('public~Name')}</th>
                  <th className="pf-v5-c-table__th">{t('public~Value')}</th>
                </tr>
              </thead>
              <tbody className="pf-v5-c-table__tbody">
                {_.map(sortedLabels, ({ name, value }) => (
                  <tr className="pf-v5-c-table__tr" key={name}>
                    <td className="pf-v5-c-table__td">{name}</td>
                    <td className="pf-v5-c-table__td">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="co-m-pane__body-group">
        <SectionHeading text={t('public~Environment variables')} />
        {_.isEmpty(config.Env) ? (
          <span className="text-muted">{t('public~No environment variables')}</span>
        ) : (
          <div className="co-table-container">
            <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
              <thead className="pf-v5-c-table__thead">
                <tr className="pf-v5-c-table__tr">
                  <th className="pf-v5-c-table__th">{t('public~Name')}</th>
                  <th className="pf-v5-c-table__th">{t('public~Value')}</th>
                </tr>
              </thead>
              <tbody className="pf-v5-c-table__tbody">
                {_.map(config.Env, (nameValueStr, i) => {
                  const pair = splitEnv(nameValueStr);
                  return (
                    <tr className="pf-v5-c-table__tr" key={i}>
                      <td className="pf-v5-c-table__td">{pair.name}</td>
                      <td className="pf-v5-c-table__td">{pair.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SupportedPlatformsTable
        submanifests={sortedSubmanifests}
        policy={importPolicyPreserveOriginal}
        heading={t('public~Supported Platforms')}
      />
    </div>
  );
};

const parseName = (nameAndTag: string): string => {
  return nameAndTag.split(':')[0];
};

const getImageStreamNameAndTag = (imageStreamTag: K8sResourceKind) => {
  const imageStreamTagName: string = _.get(imageStreamTag, 'metadata.name') || '';
  const [imageStreamName, tag] = imageStreamTagName.split(':');
  return { imageStreamName, tag };
};

const ImageStreamTagHistory: React.FC<ImageStreamTagHistoryProps> = ({
  obj: imageStreamTag,
  imageStream,
}) => {
  const { tag } = getImageStreamNameAndTag(imageStreamTag);
  const imageStreamStatusTags = _.filter(_.get(imageStream, 'status.tags'), (i) => i.tag === tag);
  return (
    <ImageStreamTimeline
      imageStreamTags={imageStreamStatusTags}
      imageStreamName={imageStream.metadata.name}
      imageStreamNamespace={imageStream.metadata.namespace}
    />
  );
};
ImageStreamTagHistory.displayName = 'ImageStreamTagHistory';

const pages = [
  navFactory.details(ImageStreamTagsDetails),
  navFactory.editYaml(),
  navFactory.history(ImageStreamTagHistory),
];
export const ImageStreamTagsDetailsPage: React.SFC<ImageStreamTagsDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={(obj) => {
        const { imageStreamName } = getImageStreamNameAndTag(obj);
        return [
          {
            name: t('public~ImageStreams'),
            path: getBreadcrumbPath(params, 'imagestreams'),
          },
          {
            name: imageStreamName,
            path: `${getBreadcrumbPath(params, 'imagestreams')}/${imageStreamName}`,
          },
          {
            name: t('public~ImageStreamTag details'),
            path: location.pathname,
          },
        ];
      }}
      kind={ImageStreamTagsReference}
      menuActions={menuActions}
      resources={[
        {
          kind: ImageStreamsReference,
          name: parseName(props.name),
          namespace: props.namespace,
          isList: false,
          prop: 'imageStream',
        },
      ]}
      pages={pages}
    />
  );
};
ImageStreamTagsDetailsPage.displayName = 'ImageStreamTagsDetailsPage';

type ImageStreamTagHistoryProps = {
  imageStream: K8sResourceKind;
  obj: K8sResourceKind;
};

export type ImageStreamTagsDetailsProps = {
  obj: K8sResourceKind;
  imageStream: K8sResourceKind;
};

export type ImageStreamTagsDetailsPageProps = {
  namespace: string;
  name: string;
};

export type RowSupportedPlatformData = {
  os: string;
  architecture: string;
  digest: string;
};
