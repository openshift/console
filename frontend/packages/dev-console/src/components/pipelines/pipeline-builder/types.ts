import { FormikValues } from 'formik';
import { PipelineParam, PipelineResource, PipelineTask } from '../../../utils/pipeline-augment';

export type PipelineBuilderFormValues = {
  name: string;
  params: PipelineParam[];
  resources: PipelineResource[];
  tasks: PipelineTask[];
};

export type PipelineBuilderFormikValues = FormikValues & PipelineBuilderFormValues;
