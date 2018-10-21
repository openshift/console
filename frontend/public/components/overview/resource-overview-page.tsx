import * as React from 'react';

import { connectToModel } from '../../kinds';
import { referenceForModel } from '../../module/k8s';
import {
  AsyncComponent,
  ResourceOverviewHeading,
  ResourceSummary,
  Cog,
} from '../utils';

import { resourceOverviewPages } from './resource-overview-pages';

const { common } = Cog.factory;
const menuActions = [...common];

export const DefaultOverviewPage = connectToModel( ({kindObj: kindObject, item}) =>
  <div className="overview__sidebar-pane resource-overview">
    <ResourceOverviewHeading
      actions={menuActions}
      kindObj={kindObject}
      resource={item.obj}
    />
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <ResourceSummary resource={item.obj} />
      </div>
    </div>
  </div>
);

export const ResourceOverviewPage = connectToModel(({kindObj, item}) => {
  const ref = referenceForModel(kindObj);
  const loader = resourceOverviewPages.get(ref, () => Promise.resolve(DefaultOverviewPage));
  return <AsyncComponent loader={loader} kindObj={kindObj} item={item} />;
});
