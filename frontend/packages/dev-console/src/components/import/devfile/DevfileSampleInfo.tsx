import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { DevfileSample } from './devfile-types';

export type DevfileSampleInfoProps = {
  devfileSample: DevfileSample;
};

const DevfileSampleInfo: React.FC<DevfileSampleInfoProps> = ({ devfileSample }) => {
  const { t } = useTranslation();
  const { icon, displayName, description, git, tags } = devfileSample;
  const iconUrl = icon ? `data:image/png;base64,${icon}` : '';
  const sampleRepo = Object.values(git.remotes)[0];

  return (
    <div>
      <div className="co-catalog-item-details">
        {iconUrl && (
          <img
            className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
            src={iconUrl}
            alt={displayName}
            aria-hidden
          />
        )}
        <div>
          <h2 className="co-section-heading co-catalog-item-details__name">{displayName}</h2>
          {tags && (
            <p className="co-catalog-item-details__tags">
              {tags.map((tag) => (
                <span className="co-catalog-item-details__tag" key={tag}>
                  {tag}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      <p className="co-catalog-item-details__description">{description}</p>
      <p>
        {t('devconsole~Sample repository:')} <ExternalLink href={sampleRepo} text={sampleRepo} />
      </p>
    </div>
  );
};

export default DevfileSampleInfo;
