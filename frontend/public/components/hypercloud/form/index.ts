export const pluralToKind = (plural) => {
  const convertKind = {
    secrets: 'Secret',
    namespaces: 'Namespace',
    servicebrokers: 'ServiceBroker',
  };
  return convertKind[plural];
}