export const pluralToKind = plural => {
  const convertKind = {
    secrets: 'Secret',
    namespaces: 'Namespace',
    namespaceclaims: 'NamespaceClaim',
    rolebindingclaims: 'RoleBindingClaim',
    resourcequotaclaims: 'ResourceQuotaClaim',
  };
  return convertKind[plural];
};

export const crd = ['namespaceclaims', 'rolebindingclaims', 'resourcequotaclaims'];
