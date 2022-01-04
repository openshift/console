const abbrBlacklist = ['ASS'];

/**
 * @deprecated - This is SDK internal function for resource-icon purposes, use Console version instead.
 * Provides an abbreviation string for given kind with respect to abbrBlacklist.
 * @param kind Kind for which the abbreviation is generated.
 * @return Abbreviation string for given kind.
 * TODO: Use in resource-icon component once it is being migrated to the SDK.
 * * */
export const kindToAbbr = (kind) => {
  const abbrKind = (kind.replace(/[^A-Z]/g, '') || kind.toUpperCase()).slice(0, 4);
  return abbrBlacklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind;
};
