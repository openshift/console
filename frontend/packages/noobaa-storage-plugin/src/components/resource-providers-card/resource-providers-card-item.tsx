import * as React from 'react';
import * as _ from 'lodash';
import { ArrowCircleDownIcon } from '@patternfly/react-icons';

const ResourceProvidersItemStatus: React.FC<ResourceProvidersRowStatusProps> = React.memo(
  ({ status }) => (
    <div className="nb-resource-providers-card__row-status">
      <div className="nb-resource-providers-card__row-status-item">
        <div>
          <ArrowCircleDownIcon />
        </div>
        <div className="nb-resource-providers-card__row-status-item-text">{status}</div>
      </div>
    </div>
  ),
);

export const ResourceProvidersItem: React.FC<ResourceProvidersRowProps> = React.memo(
  ({ title, count, unhealthyProviders }) => (
    <div className="nb-resource-providers-card__row">
      <div className="nb-resource-providers-card__row-title">{`${count} ${title}`}</div>
      {!_.isNil(unhealthyProviders[title]) && unhealthyProviders[title] > 0 ? (
        <ResourceProvidersItemStatus status={unhealthyProviders[title]} />
      ) : null}
    </div>
  ),
);

export type ProviderType = {
  [key: string]: number;
};

type ResourceProvidersRowProps = {
  title: string;
  count: number;
  unhealthyProviders: ProviderType;
};

type ResourceProvidersRowStatusProps = {
  status: number;
};
