import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PipelineRunParameters from './PipelineRunParameters';

export interface PipelineRunParametersFormProps {
  obj: K8sResourceKind;
}

const PipelineRunParametersForm: React.FC<PipelineRunParametersFormProps> = ({ obj }) => {
  const { t } = useTranslation();
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
  };
  return (
    <>
      <Formik initialValues={initialValues} onSubmit={null}>
        {() => (
          <div className="co-m-pane__body">
            <PipelineRunParameters
              fieldName="parameters"
              isReadOnly
              nameLabel={t('pipelines-plugin~Name')}
              nameFieldName="name"
              valueLabel={t('pipelines-plugin~Value')}
              valueFieldName="value"
              emptyMessage={t(
                'pipelines-plugin~No parameters are associated with this PipelineRun.',
              )}
              emptyValues={{
                name: '',
                value: '',
              }}
            />
          </div>
        )}
      </Formik>
    </>
  );
};

export default PipelineRunParametersForm;
