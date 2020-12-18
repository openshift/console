export const pluralToKind = (plural) => {
  const convertKind = {
    secrets: 'Secret',
    namespaces: 'Namespace',
    servicebrokers: 'ServiceBroker',
    serviceclasses: 'ServiceClass',
  };
  return convertKind[plural];
}