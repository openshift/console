import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PipelineRunParameters from './PipelineRunParameters';

export interface PipelineRunFormProps {
  obj: K8sResourceKind;
}

const PipelineRunForm: React.FC<PipelineRunFormProps> = ({ obj }) => {
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
  };

  return (
    <Formik initialValues={initialValues} onSubmit={null}>
      {(formikProps) => <PipelineRunParameters {...formikProps} />}
    </Formik>
  );
};

export default PipelineRunForm;
