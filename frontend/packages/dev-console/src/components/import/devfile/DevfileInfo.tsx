import * as React from 'react';
import { LayerGroupIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ExternalLink } from '@console/internal/components/utils';
import { DevfileSample } from './devfile-types';

export type DevfileInfoProps = {
  devfileSample: DevfileSample;
};

const DevfileInfo: React.FC<DevfileInfoProps> = ({ devfileSample }) => {
  const { t } = useTranslation();
  const { icon, iconClass, displayName, description, git, tags } = devfileSample;
  const iconUrl = iconClass ? getImageForIconClass(iconClass) : icon || '';
  const sampleRepo = git?.remotes ? Object.values(git.remotes)[0] : '';

  return (
    <div>
      <div className="co-catalog-item-details">
        {iconUrl ? (
          <img
            className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
            src={iconUrl}
            alt={displayName}
            aria-hidden
          />
        ) : (
          <LayerGroupIcon size="xl" />
        )}
        &nbsp;
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
      {description && <p className="co-catalog-item-details__description">{description}</p>}
      {sampleRepo && (
        <p>
          {t('devconsole~Sample repository:')} <ExternalLink href={sampleRepo} text={sampleRepo} />
        </p>
      )}
    </div>
  );
};

export default DevfileInfo;
