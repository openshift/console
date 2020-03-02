export type DataValidator = (
  fData: string,
) => {
  isValid: boolean;
  errorMessage?: string;
  parsedData?: DataState;
};

export enum Field {
  CLUSTER_NAME = 'clusterName',
  FSID = 'fsid',
  ADMIN = 'admin',
  MONDATA = 'monData',
}

export type ErrorType = {
  field: Field;
  message: string;
};

export type DataState = { [field in Field]: string };
