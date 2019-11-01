export const getFieldId = (fieldName: string, fieldType: string) => {
  return `form-${fieldType}-${fieldName.replace(/\./g, '-')}-field`;
};

export const getCheckboxFieldId = (fieldName: string, fieldValue?: string) => {
  const name = fieldValue ? `${fieldName}-${fieldValue}` : fieldName;
  return getFieldId(name, 'checkbox');
};
