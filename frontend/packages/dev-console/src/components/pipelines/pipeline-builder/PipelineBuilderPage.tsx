import * as React from 'react';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Formik, FormikBag } from 'formik';
import { Bullseye, Button, Split, SplitItem } from '@patternfly/react-core';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared/src';
import { PipelineModel } from '../../../models';
import { Pipeline } from '../../../utils/pipeline-augment';
import { warnAction } from './modals';
import PipelineBuilderForm from './PipelineBuilderForm';
import { PipelineBuilderFormValues, PipelineBuilderFormikValues } from './types';
import {
  convertBuilderFormToPipeline,
  convertPipelineToBuilderForm,
  getPipelineURL,
} from './utils';
import { validationSchema } from './validation-utils';

import './PipelineBuilderPage.scss';

type PipelineBuilderPageProps = RouteComponentProps<{ ns?: string }> & {
  existingPipeline?: Pipeline;
};

const PipelineBuilderPage: React.FC<PipelineBuilderPageProps> = (props) => {
  const {
    existingPipeline,
    match: {
      params: { ns },
    },
  } = props;

  const editingPipeline = !!existingPipeline;

  const initialValues: PipelineBuilderFormValues = {
    name: 'new-pipeline',
    params: [],
    resources: [],
    tasks: [],
    ...(convertPipelineToBuilderForm(existingPipeline) || {}),
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormValues>,
  ) => {
    let resourceCall;
    if (editingPipeline) {
      resourceCall = k8sUpdate(
        PipelineModel,
        _.merge({}, existingPipeline, convertBuilderFormToPipeline(values, ns)),
        ns,
        existingPipeline.metadata.name,
      );
    } else {
      resourceCall = k8sCreate(PipelineModel, convertBuilderFormToPipeline(values, ns));
    }

    return resourceCall
      .then(() => {
        actions.setSubmitting(false);
        history.push(`${getPipelineURL(ns)}/${values.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <div className="odc-pipeline-builder-page">
      <Helmet>
        <title>Pipeline Builder</title>
      </Helmet>
      <div className="odc-pipeline-builder-page__header">
        <Split gutter="md">
          <SplitItem isFilled>
            <h1 className="odc-pipeline-builder-page__title">Pipeline Builder</h1>
          </SplitItem>
          <SplitItem>
            <Bullseye>
              <Button
                variant="link"
                onClick={() => {
                  warnAction(
                    'Edit YAML',
                    'You are about to leave',
                    'The Pipeline Builder content will be lost if you navigate. Are you sure?',
                    () => {
                      history.push(
                        editingPipeline
                          ? `${resourcePathFromModel(
                              PipelineModel,
                              existingPipeline?.metadata?.name,
                              existingPipeline?.metadata?.namespace,
                            )}/yaml`
                          : `${getPipelineURL(ns)}/~new`,
                      );
                    },
                  );
                }}
              >
                Edit YAML
              </Button>
            </Bullseye>
          </SplitItem>
          <SplitItem>
            <Bullseye>{getBadgeFromType(PipelineModel.badge)}</Bullseye>
          </SplitItem>
        </Split>
      </div>
      <hr />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema}
        render={(formikProps) => (
          <PipelineBuilderForm {...formikProps} namespace={ns} editingPipeline={editingPipeline} />
        )}
      />
    </div>
  );
};

export default PipelineBuilderPage;
