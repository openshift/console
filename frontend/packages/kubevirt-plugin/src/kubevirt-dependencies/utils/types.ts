export const getStringEnumValues = <T>(enu) => Object.keys(enu).map((k) => enu[k] as T);
