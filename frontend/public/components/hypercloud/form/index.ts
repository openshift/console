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
    clustertemplates: 'ClusterTemplate',
    templateinstances: 'TemplateInstance',
    namespaceclaims: 'NamespaceClaim',
    rolebindingclaims: 'RoleBindingClaim',
    resourcequotaclaims: 'ResourceQuotaClaim',
  };
  return convertKind[plural];
};

export const crd = ['namespaceclaims', 'rolebindingclaims', 'resourcequotaclaims'];
