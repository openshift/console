import { FormikValues } from 'formik';
import { PipelineParam } from '../../../../utils/pipeline-augment';

export type PipelineModalFormResource = {
  name: string;
  selection: string;
  data: {
    type: string;
    params: { [key: string]: string };
    secrets?: { [key: string]: string };
  };
};

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: PipelineParam[];
  resources: PipelineModalFormResource[];
};
