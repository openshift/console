export const getFieldId = (fieldName: string, fieldType: string) => {
  return `form-${fieldType}-${fieldName?.replace(/\./g, '-')}-field`;
};
