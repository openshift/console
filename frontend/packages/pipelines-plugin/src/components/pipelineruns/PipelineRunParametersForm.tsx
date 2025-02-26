import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
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
          <PaneBody>
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
          </PaneBody>
        )}
      </Formik>
    </>
  );
};

export default PipelineRunParametersForm;
