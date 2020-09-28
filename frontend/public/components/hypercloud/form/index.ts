export const pluralToKind = (plural) => {
  const convertKind = {
    secrets: 'Secret'
  };
  return convertKind[plural];
}