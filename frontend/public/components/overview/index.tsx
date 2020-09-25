import * as React from 'react';
import { AsyncComponent } from '../utils';

export const OverviewListPageLoader = () =>
  import('./OverviewListPage' /* webpackChunkName: "overview-list-page" */).then(
    (m) => m.OverviewListPage,
  );

type OverviewListPageProps = {
  match: any;
};

export const OverviewListPage: React.FC<OverviewListPageProps> = (props) => {
  return <AsyncComponent loader={OverviewListPageLoader} {...props} />;
};
