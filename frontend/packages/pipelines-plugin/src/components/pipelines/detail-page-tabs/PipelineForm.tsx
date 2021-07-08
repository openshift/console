import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { k8sUpdate, K8sResourceKind } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { removeEmptyDefaultFromPipelineParams } from './utils';

export interface PipelineFormProps {
  PipelineFormComponent: React.ComponentType<any>;
  formName: string;
  validationSchema: any;
  obj: K8sResourceKind;
}

const PipelineForm: React.FC<PipelineFormProps> = ({
  PipelineFormComponent,
  formName,
  validationSchema,
  obj,
}) => {
  const { t } = useTranslation();
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
    resources: _.get(obj.spec, 'resources', []),
  };

  const handleSubmit = (values, actions) => {
    return k8sUpdate(
      PipelineModel,
      {
        ...obj,
        spec: {
          ...obj.spec,
          params: removeEmptyDefaultFromPipelineParams(values.parameters),
          resources: values.resources,
        },
      },
      obj.metadata.namespace,
      obj.metadata.name,
    )
      .then((newObj) => {
        actions.resetForm({
          values: {
            parameters: _.get(newObj.spec, 'params', []),
            resources: _.get(newObj.spec, 'resources', []),
          },
          status: {
            success: t('pipelines-plugin~Successfully updated the pipeline {{formName}}.', {
              formName,
            }),
          },
        });
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ status: {} });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={validationSchema}
    >
      {(formikProps) => (
        <PipelineFormComponent namespace={obj.metadata.namespace} {...formikProps} />
      )}
    </Formik>
  );
};

export default PipelineForm;
