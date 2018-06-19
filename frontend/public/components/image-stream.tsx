import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, LabelList, navFactory, Overflow, ResourceCog, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { fromNow } from './utils/datetime';
import { registerTemplate } from '../yaml-templates';

// The build config YAML template pushes to an image stream with this name.
registerTemplate('image.openshift.io/v1.ImageStream', `apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: example`);
const ImageStreamsReference: K8sResourceKindReference = 'ImageStream';
const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';

const getImageStreamTagName = (imageStreamName: string, tag: string): string => `${imageStreamName}:${tag}`;

const { common } = Cog.factory;

const menuActions = [
  ...common,
];

const ImageStreamTagsRow: React.SFC<ImageStreamTagsRowProps> = ({imageStream, specTag, statusTag}) => {
  const latest = _.get(statusTag, ['items', 0]);
  const from = _.get(specTag, 'from');
  const referencesTag = _.get(specTag, 'from.kind') === 'ImageStreamTag';
  const image = _.get(latest, 'image');
  const created = _.get(latest, 'created');
  return <div className="row">
    <div className="middler">
      <div className="col-md-2 col-sm-4 col-xs-4">
        <ResourceLink kind={ImageStreamTagsReference} name={getImageStreamTagName(imageStream.metadata.name, statusTag.tag)} namespace={imageStream.metadata.namespace} title={statusTag.tag} />
      </div>
      <span className="col-md-3 col-sm-4 col-xs-8">
        {from && referencesTag && <ResourceLink kind={ImageStreamTagsReference} name={getImageStreamTagName(imageStream.metadata.name, from.name)} namespace={imageStream.metadata.namespace} title={from.name} />}
        {from && !referencesTag && <Overflow value={from.name} />}
        {!from && <span className="text-muted">pushed image</span>}
      </span>
      <span className="col-md-4 col-sm-4 hidden-xs">
        {image && <Overflow value={image} />}
        {!image && '-'}
      </span>
      <div className="col-md-3 hidden-sm hidden-xs">
        {created && <Timestamp timestamp={created} />}
        {!created && '-'}
      </div>
    </div>
  </div>;
};

export const ImageStreamsDetails: React.SFC<ImageStreamsDetailsProps> = ({obj: imageStream}) => {
  const imageRepository = _.get(imageStream, 'status.dockerImageRepository');
  const specTagByName = _.keyBy(imageStream.spec.tags, 'name');

  return <div>
    <div className="co-m-pane__body">
      <ResourceSummary resource={imageStream} showPodSelector={false} showNodeSelector={false}>
        {imageRepository && <dt>Image Repository</dt>}
        {imageRepository && <dd>{imageRepository}</dd>}
      </ResourceSummary>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-section-title">Tags</h1>
      {_.isEmpty(imageStream.status.tags)
        ? <span className="text-muted">No tags</span>
        : <div className="row">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-md-2 col-sm-4 col-xs-4">Name</div>
              <div className="col-md-3 col-sm-4 col-xs-8">From</div>
              <div className="col-md-4 col-sm-4 hidden-xs">Identifier</div>
              <div className="col-md-3 hidden-sm hidden-xs">Last Updated</div>
            </div>
            <div className="co-m-table-grid__body">
              {_.map(imageStream.status.tags, (statusTag) =>
                <ImageStreamTagsRow
                  key={statusTag.tag}
                  imageStream={imageStream}
                  specTag={specTagByName[statusTag.tag]}
                  statusTag={statusTag} />)}
            </div>
          </div>
        </div>}
    </div>
  </div>;
};

const pages = [navFactory.details(ImageStreamsDetails), navFactory.editYaml()];
export const ImageStreamsDetailsPage: React.SFC<ImageStreamsDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={ImageStreamsReference}
    menuActions={menuActions}
    pages={pages} />;
ImageStreamsDetailsPage.displayName = 'ImageStreamsDetailsPage';

const ImageStreamsHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const ImageStreamsRow: React.SFC<ImageStreamsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <ResourceCog actions={menuActions} kind={ImageStreamsReference} resource={obj} />
    <ResourceLink kind={ImageStreamsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-xs-3">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-xs-3">
    <LabelList kind={ImageStreamsReference} labels={obj.metadata.labels} />
  </div>
  <div className="col-xs-3">
    { fromNow(obj.metadata.creationTimestamp) }
  </div>
</div>;

export const ImageStreamsList: React.SFC = props => <List {...props} Header={ImageStreamsHeader} Row={ImageStreamsRow} />;
ImageStreamsList.displayName = 'ImageStreamsList';

export const buildPhase = build => build.status.phase;

export const ImageStreamsPage: React.SFC<ImageStreamsPageProps> = props =>
  <ListPage
    {...props}
    title="Image Streams"
    kind={ImageStreamsReference}
    ListComponent={ImageStreamsList}
    canCreate={true}
  />;
ImageStreamsPage.displayName = 'ImageStreamsListPage';

/*  eslint-disable no-undef, no-unused-vars  */
type ImageStreamTagsRowProps = {
  imageStream: any,
  specTag: any,
  statusTag: any,
};

export type ImageStreamsRowProps = {
  obj: any,
};

export type ImageStreamsDetailsProps = {
  obj: any,
};

export type ImageStreamsPageProps = {
  filterLabel: string,
};

export type ImageStreamsDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef, no-unused-vars */
