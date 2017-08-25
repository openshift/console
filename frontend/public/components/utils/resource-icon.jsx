import * as React from 'react';
import * as classNames from 'classnames';

import { connectToKinds } from '../../kinds';

export const ResourceIcon = connectToKinds()(function ResourceIcon ({kind, className, kindObj}) {
  const klass = classNames(`co-m-resource-icon co-m-resource-${kind.toLowerCase()}`, className);
  const iconLabel = kindObj.abbr || kind.toUpperCase().slice(0, 2);
  return <span className={klass}>{iconLabel}</span>;
});

ResourceIcon.displayName = 'ResourceIcon';

export const ResourceName = ({kind, name}) => <span><ResourceIcon kind={kind} /> {name}</span>;
