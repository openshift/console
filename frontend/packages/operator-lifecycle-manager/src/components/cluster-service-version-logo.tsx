import { Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import operatorLogo from '../operator.svg';
import type { ClusterServiceVersionIcon, DeprecatedOperatorWarning } from '../types';
import { DeprecatedOperatorWarningBadge } from './deprecated-operator-warnings/deprecated-operator-warnings';

type ClusterServiceVersionHeaderIconProps = {
  icon: ClusterServiceVersionIcon | string;
};

export const ClusterServiceVersionHeaderIcon: Snail.FCC<ClusterServiceVersionHeaderIconProps> = ({
  icon,
}) => {
  const imgSrc: string = _.isString(icon)
    ? icon
    : _.isEmpty(icon)
    ? operatorLogo
    : `data:${icon.mediatype};base64,${icon.base64data}`;

  return (
    <div className="co-clusterserviceversion-logo__icon">
      <span className="co-catalog-item-icon__bg">
        <img
          className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
          src={imgSrc}
          // because we have the operator name right next to this image,
          // this icon is presentational so we can use an empty alt
          alt=""
        />
      </span>
    </div>
  );
};

type ClusterServiceVersionHeaderTitleProps = {
  displayName: string;
  provider?: { name: string } | string;
  version?: string;
} & DeprecatedOperatorWarning;

export const ClusterServiceVersionHeaderTitle: Snail.FCC<ClusterServiceVersionHeaderTitleProps> = ({
  displayName,
  provider,
  version,
  deprecation,
}) => {
  const { t } = useTranslation();

  return (
    <div className="co-clusterserviceversion-logo__name">
      <Title
        headingLevel="h1"
        className="co-clusterserviceversion-logo__name__clusterserviceversion"
      >
        {displayName}{' '}
        {deprecation && (
          <DeprecatedOperatorWarningBadge className="pf-v6-u-ml-sm" deprecation={deprecation} />
        )}
      </Title>
      {provider && (
        <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
          {t('olm~{{version}} provided by {{provider}}', {
            version: version || '',
            provider: _.get(provider, 'name', provider),
          })}
        </span>
      )}
    </div>
  );
};

export type ClusterServiceVersionLogoProps = ClusterServiceVersionHeaderIconProps &
  ClusterServiceVersionHeaderTitleProps;

export const ClusterServiceVersionLogo: Snail.FCC<ClusterServiceVersionLogoProps> = ({
  icon,
  displayName,
  provider,
  version,
  deprecation,
}) => (
  <div className="co-clusterserviceversion-logo">
    <ClusterServiceVersionHeaderIcon icon={icon} />
    <ClusterServiceVersionHeaderTitle
      displayName={displayName}
      provider={provider}
      version={version}
      deprecation={deprecation}
    />
  </div>
);
