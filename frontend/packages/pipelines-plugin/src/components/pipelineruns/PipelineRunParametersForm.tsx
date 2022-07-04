import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PipelineRunParameters from './PipelineRunParameters';

export interface PipelineRunParametersFormProps {
  obj: K8sResourceKind;
}

const PipelineRunParametersForm: React.FC<PipelineRunParametersFormProps> = ({ obj }) => {
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
  };

  return (
    <Formik initialValues={initialValues} onSubmit={null}>
      {(formikProps) => <PipelineRunParameters {...formikProps} />}
    </Formik>
  );
};

export default PipelineRunParametersForm;
