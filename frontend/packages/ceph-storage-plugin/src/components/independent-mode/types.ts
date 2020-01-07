export type DataValidator = (
  fName: string,
  fData: string,
) => {
  isValid: boolean;
  errorMessage?: string;
  parsedData?: DataState;
};

export enum Field {
  NAMESPACE = 'ns',
  FSID = 'fsid',
  ADMIN = 'admin',
  MONDATA = 'mondata',
}

export type ErrorType = {
  field: Field;
  message: string;
};

export type DataState = { [field in Field]: string };
