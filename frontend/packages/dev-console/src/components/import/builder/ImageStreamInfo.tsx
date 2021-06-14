import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ImageStreamIcon } from '@console/internal/components/catalog/catalog-item-icon';
import { getAnnotationTags } from '@console/internal/components/image-stream';
import { ExternalLink } from '@console/internal/components/utils';
import { getSampleRepo } from '../../../utils/imagestream-utils';

export type ImageStreamInfoProps = {
  displayName: string;
  tag: object;
};

const ImageStreamInfo: React.FC<ImageStreamInfoProps> = ({ displayName, tag }) => {
  const { t } = useTranslation();
  const annotationTags = getAnnotationTags(tag);
  const description = _.get(tag, 'annotations.description');
  const sampleRepo = getSampleRepo(tag);

  return (
    <div>
      <div className="co-catalog-item-details">
        <ImageStreamIcon tag={tag} iconSize="large" />
        <div>
          <h2 className="co-section-heading co-catalog-item-details__name">{displayName}</h2>
          {annotationTags && (
            <p className="co-catalog-item-details__tags">
              {_.map(annotationTags, (annotationTag, i) => (
                <span className="co-catalog-item-details__tag" key={i}>
                  {annotationTag}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      {description && <p className="co-catalog-item-details__description">{description}</p>}
      {sampleRepo && (
        <p>
          {t('devconsole~Sample repository:')} <ExternalLink href={sampleRepo} text={sampleRepo} />
        </p>
      )}
    </div>
  );
};

export default ImageStreamInfo;
