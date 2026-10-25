/* eslint-disable no-barrel-files/no-barrel-files */
import { AsyncComponent } from '../utils/async';

export const Area = (props) => (
  <AsyncComponent loader={() => import('./graph-loader').then((c) => c.Area)} {...props} />
);
