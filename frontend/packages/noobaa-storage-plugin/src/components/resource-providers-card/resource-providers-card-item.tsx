import * as React from 'react';
import * as _ from 'lodash';
import { RedExclamationCircleIcon } from '@console/shared';

const ResourceProvidersItemStatus: React.FC<ResourceProvidersRowStatusProps> = React.memo(
  ({ status, link }) => (
    <div className="nb-resource-providers-card__row-status">
      <div className="nb-resource-providers-card__row-status-item">
        <a href={link} style={{ textDecoration: 'none' }}>
          <RedExclamationCircleIcon className="nb-resource-provider-card__status-icon" />
          <span className="nb-resource-providers-card__row-status-item-text">{status}</span>
        </a>
      </div>
    </div>
  ),
);

export const ResourceProvidersItem: React.FC<ResourceProvidersRowProps> = React.memo(
  ({ title, count, unhealthyProviders, link }) => (
    <div className="nb-resource-providers-card__row">
      <div className="nb-resource-providers-card__row-title">{`${count} ${title}`}</div>
      {!_.isNil(unhealthyProviders[title]) && unhealthyProviders[title] > 0 ? (
        <ResourceProvidersItemStatus status={unhealthyProviders[title]} link={link} />
      ) : null}
    </div>
  ),
);

export type ProviderType = {
  [key: string]: number;
};

type ResourceProvidersRowProps = {
  count: number;
  link: string;
  title: string;
  unhealthyProviders: ProviderType;
};

type ResourceProvidersRowStatusProps = {
  link: string;
  status: number;
};
