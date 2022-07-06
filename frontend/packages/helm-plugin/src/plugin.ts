import { FLAG_OPENSHIFT_HELM } from './const';
import {
  helmChartRepoModelProviderForBreadcrumbs,
  helmChartRepositoriesBreadcrumbsProvider,
} from './providers';

const plugin = [
  {
    type: 'DetailPageBreadCrumbs',
    properties: {
      getModels: helmChartRepoModelProviderForBreadcrumbs,
      breadcrumbsProvider: helmChartRepositoriesBreadcrumbsProvider,
    },
    flags: {
      required: [FLAG_OPENSHIFT_HELM],
    },
  },
];

export default plugin;
