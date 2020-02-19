type StringHashMap = {
  [key: string]: string;
};

const getPrefixedKey = (obj: StringHashMap, keyPrefix: string) =>
  obj ? Object.keys(obj).find((key) => key.startsWith(keyPrefix)) : null;

const getSuffixValue = (key: string) => {
  const index = key ? key.lastIndexOf('/') : -1;
  return index > 0 ? key.substring(index + 1) : null;
};

export const getValueByPrefix = (obj: StringHashMap, keyPrefix: string) => {
  const key = getPrefixedKey(obj, keyPrefix);
  return key ? obj[key] : null;
};

export const findKeySuffixValue = (obj: StringHashMap, keyPrefix: string) =>
  getSuffixValue(getPrefixedKey(obj, keyPrefix));

export const findHighestKeyBySuffixValue = (obj: StringHashMap, keyPrefix: string) => {
  const sortedKeys = Object.keys(obj)
    .filter((key) => key.startsWith(keyPrefix))
    .sort();
  return getSuffixValue(sortedKeys[sortedKeys.length - 1]);
};

export const getSimpleName = (obj): string => obj && obj.name;
