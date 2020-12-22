export const pluralToKind = plural => {
  const convertKind = {
    secrets: 'Secret',
    namespaces: 'Namespace',
    servicebrokers: 'ServiceBroker',
    serviceclasses: 'ServiceClass',
    serviceplans: 'ServicePlan',
    clusterservicebrokers: 'ClusterServiceBroker',
    clusterserviceclasses: 'ClusterServiceClass',
    clusterserviceplans: 'ClusterServicePlan',
    serviceinstances: 'ServiceInstance',
    servicebindings: 'ServiceBinding',
    catalogserviceclaims: 'CatalogServiceClaim',
    templates: 'Template',
    templateinstances: 'TemplateInstance',
  };
  return convertKind[plural];
};
