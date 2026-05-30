export enum JSONSchemaType {
  string = 'string',
  number = 'number',
  integer = 'integer',
  boolean = 'boolean',
  array = 'array',
  object = 'object',
}

export type DynamicFormFieldOptionsList = {
  label: string;
  value: string;
}[];

type DynamicFormFieldDependency = {
  controlFieldPath: string;
  controlFieldValue: string;
  controlFieldName: string;
};

export type UiSchemaOptionsWithDependency = {
  dependency?: DynamicFormFieldDependency;
};

export type DynamicFormSchemaError = {
  title: string;
  message: string;
};
