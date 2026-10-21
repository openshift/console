import type { FC } from 'react';
import { AsyncComponent } from '../utils/async';

export const OverviewListPageLoader = () =>
  import('./OverviewListPage' /* webpackChunkName: "overview-list-page" */).then(
    (m) => m.OverviewListPage,
  );

export const OverviewListPage: FC = (props) => {
  return <AsyncComponent loader={OverviewListPageLoader} {...props} />;
};
