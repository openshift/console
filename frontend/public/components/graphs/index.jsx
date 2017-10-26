import * as React from 'react';

import { AsyncComponent } from '../utils/async';
import { k8sBasePath } from '../../module/k8s';

export { Status } from './status';

export const prometheusBasePath = `${k8sBasePath}/api/v1/proxy/namespaces/tectonic-system/services/prometheus:9090`;
export const Bar = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Line)} {...props} />;
export const Scalar = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Scalar)} {...props} />;
export const Donut = props => <AsyncComponent loader={() => System.import('./graph-loader').then(c => c.Donut)} {...props} />;
