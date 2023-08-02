import * as React from 'react';
import { AsyncComponent } from '../utils';

export const OverviewListPageLoader = () =>
  import('./OverviewListPage' /* webpackChunkName: "overview-list-page" */).then(
    (m) => m.OverviewListPage,
  );

export const OverviewListPage: React.FC = (props) => {
  return <AsyncComponent loader={OverviewListPageLoader} {...props} />;
};
