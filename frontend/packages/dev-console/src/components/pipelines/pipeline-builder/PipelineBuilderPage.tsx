import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Formik, FormikBag } from 'formik';
import { Button } from '@patternfly/react-core';
import { history, PageHeading } from '@console/internal/components/utils';
import { k8sCreate } from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared/src';
import { PipelineModel } from '../../../models';
import PipelineBuilderForm from './PipelineBuilderForm';
import { PipelineBuilderFormValues, PipelineBuilderFormikValues } from './types';
import { convertBuilderFormToPipeline, getPipelineURL } from './utils';
import { validationSchema } from './validation-utils';

type PipelineBuilderPageProps = RouteComponentProps<{ ns?: string }>;

const PipelineBuilderPage: React.FC<PipelineBuilderPageProps> = ({ match }) => {
  const {
    params: { ns },
  } = match;

  const initialValues: PipelineBuilderFormValues = {
    name: 'new-pipeline',
    params: [],
    resources: [],
    tasks: [],
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormValues>,
  ) => {
    return k8sCreate(PipelineModel, convertBuilderFormToPipeline(values, ns))
      .then(() => {
        actions.setSubmitting(false);
        history.push(`${getPipelineURL(ns)}/${values.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <>
      <Helmet>
        <title>Pipeline Builder</title>
      </Helmet>
      <PageHeading title="Build Pipeline" badge={getBadgeFromType(PipelineModel.badge)} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 16 }}>
          <Button variant="link" onClick={() => history.push(`${getPipelineURL(ns)}/~new`)}>
            Edit YAML
          </Button>
        </div>
      </div>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema}
        render={(props) => <PipelineBuilderForm {...props} namespace={ns} />}
      />
    </>
  );
};

export default PipelineBuilderPage;
