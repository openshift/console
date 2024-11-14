import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DeprecatedOperatorWarning } from '@console/operator-lifecycle-manager/src/types';
import operatorLogo from '../operator.svg';
import { ClusterServiceVersionIcon } from '../types';
import { DeprecatedOperatorWarningBadge } from './deprecated-operator-warnings/deprecated-operator-warnings';

export const ClusterServiceVersionLogo: React.FC<ClusterServiceVersionLogoProps> = (props) => {
  const { icon, displayName, provider, version, deprecation } = props;
  const { t } = useTranslation();

  const imgSrc: string = _.isString(icon)
    ? icon
    : _.isEmpty(icon)
    ? operatorLogo
    : `data:${icon.mediatype};base64,${icon.base64data}`;

  return (
    <div className="co-clusterserviceversion-logo">
      <div className="co-clusterserviceversion-logo__icon">
        <span className="co-catalog-item-icon__bg">
          <img
            className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
            src={imgSrc}
            alt={displayName}
            aria-hidden
          />
        </span>
      </div>
      <div className="co-clusterserviceversion-logo__name">
        <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">
          {displayName}{' '}
          {deprecation && (
            <DeprecatedOperatorWarningBadge className="pf-v5-u-ml-sm" deprecation={deprecation} />
          )}
        </h1>
        {provider && (
          <span className="co-clusterserviceversion-logo__name__provider text-muted">
            {t('olm~{{version}} provided by {{provider}}', {
              version: version || '',
              provider: _.get(provider, 'name', provider),
            })}
          </span>
        )}
      </div>
    </div>
  );
};
export type ClusterServiceVersionLogoProps = {
  displayName: string;
  icon: ClusterServiceVersionIcon | string;
  provider?: { name: string } | string;
  version?: string;
} & DeprecatedOperatorWarning;
