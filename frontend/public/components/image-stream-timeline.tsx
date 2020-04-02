import * as React from 'react';
import * as _ from 'lodash-es';
import { CircleIcon, SquareIcon } from '@patternfly/react-icons';

import { K8sResourceKindReference } from '../module/k8s';
import { ResourceLink } from './utils/resource-link';
import { Timestamp } from './utils/timestamp';
import { EmptyBox } from './utils/status-box';
import { getImageStreamTagName } from './image-stream';

const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';

const ImageStreamTimelineItem: React.FC<ImageStreamTimelineItemProps> = ({
  tag,
  imageStreamName,
  imageStreamNamespace,
  linkToTag,
}) => {
  const referenceAndSHA = _.split(tag.dockerImageReference, '@');
  return (
    <>
      <li>
        <div className="co-images-stream-tag-timeline__item-row">
          <span className="co-images-stream-tag-timeline__circle-icon">
            <CircleIcon />
          </span>
          <div className="co-images-stream-tag-timeline__timestamp">
            <Timestamp timestamp={tag.created} simple={true} />
          </div>
        </div>

        <div className="co-images-stream-tag-timeline__item-row">
          <span className="co-images-stream-tag-timeline__line" />
          <div className="co-images-stream-tag-timeline__info">
            <ResourceLink
              kind={ImageStreamTagsReference}
              name={getImageStreamTagName(imageStreamName, tag.tag)}
              namespace={imageStreamNamespace}
              title={tag.tag}
              linkTo={linkToTag}
            />
            <div className="co-break-all">from {referenceAndSHA[0]}</div>
            <div className="co-break-all">{referenceAndSHA[1]}</div>
          </div>
        </div>
      </li>
    </>
  );
};

// check is the compared tag version, is the latest version in a sorted array of all tag versions
const isTagVersionLatest = (
  comparedTag: string,
  comparedTagPosition: number,
  orderedTagArray: TagMeta[],
) => {
  return (
    comparedTagPosition ===
    _.findIndex(orderedTagArray, (orderedTag: TagMeta) => orderedTag.tag === comparedTag)
  );
};

export const ImageStreamTimeline: React.FC<ImageStreamTimelineProps> = ({
  imageStreamTags,
  imageStreamName,
  imageStreamNamespace,
}) => {
  if (!_.some(imageStreamTags, 'items')) {
    return <EmptyBox label="Images" />;
  }
  const tagsArray: TagMeta[] = _.flatten(
    _.map(imageStreamTags, ({ tag, items }) => {
      return _.map(items, ({ created, dockerImageReference }) => ({
        tag,
        created,
        dockerImageReference,
      }));
    }),
  );
  const orderedTagArray = _.orderBy(tagsArray, ['created'], ['desc']);
  const timeline = _.map(orderedTagArray, (tag: TagMeta, i: number) => {
    return (
      <ImageStreamTimelineItem
        key={tag.dockerImageReference}
        tag={tag}
        imageStreamName={imageStreamName}
        imageStreamNamespace={imageStreamNamespace}
        linkToTag={isTagVersionLatest(tag.tag, i, orderedTagArray)}
      />
    );
  });

  return (
    <>
      <ul className="co-images-stream-tag-timeline">
        {timeline}
        <div>
          <span className="co-images-stream-tag-timeline__square-icon">
            <SquareIcon />
          </span>
        </div>
      </ul>
    </>
  );
};

type ImageStreamTimelineItemProps = {
  tag: TagMeta;
  imageStreamName: string;
  imageStreamNamespace: string;
  linkToTag: boolean;
};

type TagMeta = {
  created: string;
  tag: string;
  dockerImageReference: string;
};

type ImageStreamTimelineProps = {
  imageStreamTags: any[];
  imageStreamName: string;
  imageStreamNamespace: string;
};
