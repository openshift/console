export const getFieldId = (fieldName: string, fieldType: string) =>
  `form-${fieldType}-${fieldName?.replace(/\./g, '-')}-field`;
