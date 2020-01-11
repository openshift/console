import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { createOrUpdateResources } from '../import/import-submit-utils';
import { validationSchema } from '../import/import-validation-utils';
import EditApplicationForm from './EditApplicationForm';
import { EditApplicationProps } from './edit-application-types';
import * as EditApplicationUtils from './edit-application-utils';

const EditApplication: React.FC<EditApplicationProps> = ({
  namespace,
  appName,
  editAppResource,
  resources: appResources,
  onCancel,
  onSubmit,
}) => {
  const builderImages: NormalizedBuilderImages =
    appResources.imageStreams && appResources.imageStreams.loaded
      ? normalizeBuilderImages(appResources.imageStreams.data)
      : null;

  const currentImage = _.split(
    _.get(appResources, 'buildConfig.data.spec.strategy.sourceStrategy.from.name', ''),
    ':',
  );

  const appGroupName = _.get(editAppResource, 'metadata.labels["app.kubernetes.io/part-of"]');

  const initialValues = {
    formType: 'edit',
    name: appName,
    application: {
      name: appGroupName,
      selectedKey: appGroupName,
    },
    project: {
      name: namespace,
    },
    git: EditApplicationUtils.getGitData(_.get(appResources, 'buildConfig.data')),
    docker: {
      dockerfilePath: _.get(
        appResources,
        'buildConfig.data.spec.strategy.dockerStrategy.dockerfilePath',
        'Dockerfile',
      ),
      containerPort: parseInt(
        _.split(_.get(appResources, 'route.data.spec.port.targetPort'), '-')[0],
        10,
      ),
    },
    image: {
      selected: currentImage[0] || '',
      recommended: '',
      tag: currentImage[1] || '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    route: EditApplicationUtils.getRouteData(_.get(appResources, 'route.data'), editAppResource),
    resources: EditApplicationUtils.getResourcesType(editAppResource),
    serverless: EditApplicationUtils.getServerlessData(editAppResource),
    pipeline: {
      enabled: false,
    },
    build: EditApplicationUtils.getBuildData(_.get(appResources, 'buildConfig.data')),
    deployment: EditApplicationUtils.getDeploymentData(editAppResource),
    labels: EditApplicationUtils.getUserLabels(editAppResource),
    limits: EditApplicationUtils.getLimitsData(editAppResource),
  };

  const handleSubmit = (values, actions) => {
    const imageStream =
      values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;

    createOrUpdateResources(
      values,
      imageStream,
      false,
      false,
      'update',
      appResources,
      editAppResource,
    )
      .then(() => {
        actions.setSubmitting(false);
        actions.setStatus({ error: '' });
        onSubmit();
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ error: err.message });
      });
  };

  const renderForm = (props) => {
    return <EditApplicationForm {...props} builderImages={builderImages} />;
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={onCancel}
      validationSchema={validationSchema}
      render={renderForm}
    />
  );
};

export default EditApplication;
