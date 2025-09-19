import { OverviewResourceTab, Plugin } from '@console/plugin-sdk';
import { TopologyConsumedExtensions, topologyPlugin } from './topology/topology-plugin';

type ConsumedExtensions = OverviewResourceTab | TopologyConsumedExtensions;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Overview/Resource',
    properties: {
      // t('knative-plugin~Resources')
      name: '%knative-plugin~Resources%',
      key: 'configurations',
      loader: () =>
        import(
          './components/overview/OverviewDetailsKnativeResourcesTab' /* webpackChunkName: "knative-overview" */
        ).then((m) => m.default),
    },
  },
  ...topologyPlugin,
];

export default plugin;
