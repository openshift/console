export const pluralToKind = (plural) => {
  const convertKind = {
    secrets: 'Secret',
    namespaces: 'Namespace'
  };
  return convertKind[plural];
}