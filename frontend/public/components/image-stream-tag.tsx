import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { ImageStreamTagModel } from '../models';
import { DetailsPage } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceSummary } from './utils';
import { humanizeBinaryBytes } from './utils/units';
import { ExampleDockerCommandPopover } from './image-stream';
import { ImageStreamTimeline } from './image-stream-timeline';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';

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

export const ImageStreamTagsDetails: React.SFC<ImageStreamTagsDetailsProps> = ({
  obj: imageStreamTag,
  imageStream,
}) => {
  const config = _.get(imageStreamTag, 'image.dockerImageMetadata.Config', {});
  const labels = config.Labels || {};
  // Convert to an array of objects with name and value properties, then sort the array for display.
  const labelsArray = _.map(labels, (value, name) => ({ name, value }));
  const sortedLabels = _.sortBy(labelsArray, 'name');
  const entrypoint = (config.Entrypoint || []).join(' ');
  const cmd = (config.Cmd || []).join(' ');
  const exposedPorts = _.keys(config.ExposedPorts).join(', ');
  const size = _.get(imageStreamTag, 'image.dockerImageMetadata.Size');
  const humanizedSize = _.isFinite(size) && humanizeBinaryBytes(size).string;
  const architecture = _.get(imageStreamTag, 'image.dockerImageMetadata.Architecture');
  const tagName = _.get(imageStreamTag, 'tag.name');

  return (
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-md-6 col-sm-12">
            <SectionHeading text="Image Details" />
            <ResourceSummary resource={imageStreamTag}>
              {labels.name && <dt>Image Name</dt>}
              {labels.name && <dd>{labels.name}</dd>}
              {labels.summary && <dt>Summary</dt>}
              {labels.summary && <dd>{labels.summary}</dd>}
              {humanizedSize && <dt>Size</dt>}
              {humanizedSize && <dd>{humanizedSize}</dd>}
            </ResourceSummary>
            <ExampleDockerCommandPopover imageStream={imageStream} tag={tagName} />
          </div>
          <div className="col-md-6 col-sm-12">
            <SectionHeading text="Configuration" />
            <dl className="co-m-pane__details">
              {entrypoint && <dt>Entrypoint</dt>}
              {entrypoint && <dd className="co-break-word">{entrypoint}</dd>}
              {cmd && <dt>Command</dt>}
              {cmd && <dd className="co-break-word">{cmd}</dd>}
              {config.WorkingDir && <dt>Working Dir</dt>}
              {config.WorkingDir && <dd className="co-break-all">{config.WorkingDir}</dd>}
              {exposedPorts && <dt>Exposed Ports</dt>}
              {exposedPorts && <dd className="co-break-word">{exposedPorts}</dd>}
              {config.User && <dt>User</dt>}
              {config.User && <dd>{config.User}</dd>}
              {architecture && <dt>Architecture</dt>}
              {architecture && <dd>{architecture}</dd>}
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <SectionHeading text="Image Labels" />
        {_.isEmpty(sortedLabels) ? (
          <span className="text-muted">No labels</span>
        ) : (
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {_.map(sortedLabels, ({ name, value }) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="co-m-pane__body-group">
        <SectionHeading text="Environment Variables" />
        {_.isEmpty(config.Env) ? (
          <span className="text-muted">No environment variables</span>
        ) : (
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {_.map(config.Env, (nameValueStr, i) => {
                  const pair = splitEnv(nameValueStr);
                  return (
                    <tr key={i}>
                      <td>{pair.name}</td>
                      <td>{pair.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
export const ImageStreamTagsDetailsPage: React.SFC<ImageStreamTagsDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    breadcrumbsFor={(obj) => {
      const { imageStreamName } = getImageStreamNameAndTag(obj);
      return [
        { name: 'Image Streams', path: getBreadcrumbPath(props.match, 'imagestreams') },
        {
          name: imageStreamName,
          path: `${getBreadcrumbPath(props.match, 'imagestreams')}/${imageStreamName}`,
        },
        {
          name: 'Image Stream Tag Details',
          path: props.match.url,
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
  match: any;
  namespace: string;
  name: string;
};
