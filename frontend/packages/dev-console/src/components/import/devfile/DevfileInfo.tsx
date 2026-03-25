import type { FC } from 'react';
import { Icon } from '@patternfly/react-core';
import { LayerGroupIcon } from '@patternfly/react-icons/dist/esm/icons/layer-group-icon';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import type { DevfileSample } from './devfile-types';

export type DevfileInfoProps = {
  devfileSample: DevfileSample;
};

const DevfileInfo: FC<DevfileInfoProps> = ({ devfileSample }) => {
  const { t } = useTranslation();
  const { icon, iconClass, displayName, description, git, tags } = devfileSample;
  const iconUrl = iconClass ? getImageForIconClass(iconClass) : icon || '';
  const sampleRepo = git?.remotes ? Object.values(git.remotes)[0] : '';

  return (
    <div>
      <div className="co-catalog-item-details">
        {iconUrl ? (
          <div className="co-catalog-item-icon">
            <span className="co-catalog-item-icon__bg">
              <img
                className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
                src={iconUrl}
                alt={displayName}
                aria-hidden
              />
            </span>
          </div>
        ) : (
          <Icon size="xl">
            <LayerGroupIcon />
          </Icon>
        )}
        &nbsp;
        <div>
          <SecondaryHeading className="co-catalog-item-details__name">
            {displayName}
          </SecondaryHeading>
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
