import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Formik, FormikBag } from 'formik';
import { safeLoad } from 'js-yaml';
import { history } from '@console/internal/components/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { k8sCreate, k8sUpdate, referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { PipelineKind } from '../../../types';
import PipelineBuilderForm from './PipelineBuilderForm';
import { PipelineBuilderFormYamlValues, PipelineBuilderFormikValues } from './types';
import { convertBuilderFormToPipeline, convertPipelineToBuilderForm } from './utils';
import { initialPipelineFormData } from './const';
import { validationSchema } from './validation-utils';

import './PipelineBuilderPage.scss';

type PipelineBuilderPageProps = RouteComponentProps<{ ns?: string }> & {
  existingPipeline?: PipelineKind;
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
    formData: {
      ...initialPipelineFormData,
      ...(convertPipelineToBuilderForm(existingPipeline) || {}),
    },
    taskResources: {
      clusterTasks: [],
      namespacedTasks: [],
      tasksLoaded: false,
    },
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormYamlValues>,
  ) => {
    let pipeline: PipelineKind;
    if (values.editorType === EditorType.YAML) {
      try {
        pipeline = safeLoad(values.yamlData);
        if (!pipeline.metadata?.namespace) {
          pipeline.metadata.namespace = ns;
        }
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
        history.push(`/k8s/ns/${ns}/${referenceForModel(PipelineModel)}/${pipeline.metadata.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <div className="odc-pipeline-builder-page">
      <Helmet>
        <title>{t('pipelines-plugin~Pipeline builder')}</title>
      </Helmet>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema()}
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
