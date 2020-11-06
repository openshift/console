import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Formik, FormikBag } from 'formik';
import { safeLoad } from 'js-yaml';
import { history } from '@console/internal/components/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { Pipeline } from '../../../utils/pipeline-augment';
import PipelineBuilderForm from './PipelineBuilderForm';
import { PipelineBuilderFormYamlValues, PipelineBuilderFormikValues } from './types';
import {
  convertBuilderFormToPipeline,
  convertPipelineToBuilderForm,
  getPipelineURL,
} from './utils';
import { initialPipelineFormData } from './const';
import { validationSchema } from './validation-utils';

import './PipelineBuilderPage.scss';

type PipelineBuilderPageProps = RouteComponentProps<{ ns?: string }> & {
  existingPipeline?: Pipeline;
};

const PipelineBuilderPage: React.FC<PipelineBuilderPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    existingPipeline,
    match: {
      params: { ns },
    },
  } = props;

  const initialValues: PipelineBuilderFormYamlValues = {
    editorType: EditorType.Form,
    yamlData: '',
    formData: initialPipelineFormData,
    ...(convertPipelineToBuilderForm(existingPipeline) || {}),
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormYamlValues>,
  ) => {
    let pipeline: Pipeline;
    if (values.editorType === EditorType.YAML) {
      try {
        pipeline = safeLoad(values.yamlData);
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return null;
      }
    } else {
      pipeline = convertBuilderFormToPipeline(values.formData, ns, existingPipeline);
    }

    let resourceCall: Promise<any>;
    if (existingPipeline) {
      resourceCall = k8sUpdate(PipelineModel, pipeline, ns, existingPipeline.metadata.name);
    } else {
      resourceCall = k8sCreate(PipelineModel, pipeline);
    }

    return resourceCall
      .then(() => {
        actions.setSubmitting(false);
        history.push(`${getPipelineURL(ns)}/${pipeline.metadata.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <div className="odc-pipeline-builder-page">
      <Helmet>
        <title>{t('pipelines-plugin~Pipeline Builder')}</title>
      </Helmet>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema(t)}
      >
        {(formikProps) => (
          <PipelineBuilderForm
            {...formikProps}
            namespace={ns}
            existingPipeline={existingPipeline}
          />
        )}
      </Formik>
    </div>
  );
};

export default PipelineBuilderPage;
