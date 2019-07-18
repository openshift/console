type StringHashMap = {
  [key: string]: string;
};

const getPrefixedKey = (obj: StringHashMap, keyPrefix: string) =>
  obj ? Object.keys(obj).find((key) => key.startsWith(keyPrefix)) : null;

export const getValueByPrefix = (obj: StringHashMap, keyPrefix: string) => {
  const key = getPrefixedKey(obj, keyPrefix);
  return key ? obj[key] : null;
};

export const findKeySuffixValue = (obj: StringHashMap, keyPrefix: string) => {
  const key = getPrefixedKey(obj, keyPrefix);
  const index = key ? key.lastIndexOf('/') : -1;
  return index > 0 ? key.substring(index + 1) : null;
};
