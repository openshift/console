import type { FC } from 'react';
import { AsyncComponent } from '../utils/async';

const OverviewListPageLoader = () =>
  // eslint-disable-next-line import/no-cycle -- import to this module is dynamic
  import('./OverviewListPage' /* webpackChunkName: "overview-list-page" */).then(
    (m) => m.OverviewListPage,
  );

export const OverviewListPage: FC = (props) => (
  <AsyncComponent loader={OverviewListPageLoader} {...props} />
);
