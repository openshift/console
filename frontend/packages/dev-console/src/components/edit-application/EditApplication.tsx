import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import * as plugins from '@console/internal/plugins';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { history } from '@console/internal/components/utils';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { createOrUpdateResources } from '../import/import-submit-utils';
import { validationSchema } from '../import/import-validation-utils';
import { createOrUpdateDeployImageResources } from '../import/deployImage-submit-utils';
import { deployValidationSchema } from '../import/deployImage-validation-utils';
import EditApplicationForm from './EditApplicationForm';
import { EditApplicationProps } from './edit-application-types';
import { getPageHeading, getInitialValues } from './edit-application-utils';

export interface StateProps {
  perspective: string;
}

const EditApplication: React.FC<EditApplicationProps & StateProps> = ({
  perspective,
  namespace,
  appName,
  resources: appResources,
}) => {
  const imageStreamsData =
    appResources.imageStreams && appResources.imageStreams.loaded
      ? appResources.imageStreams.data
      : [];
  const builderImages: NormalizedBuilderImages = !_.isEmpty(imageStreamsData)
    ? normalizeBuilderImages(imageStreamsData)
    : null;
  const initialValues = getInitialValues(appResources, appName, namespace);
  const pageHeading = getPageHeading(_.get(initialValues, 'build.strategy', ''));
  const handleRedirect = (project: string) => {
    const perspectiveData = plugins.registry
      .getPerspectives()
      .find((item) => item.properties.id === perspective);
    const redirectURL = perspectiveData.properties.getImportRedirectURL(project);
    history.push(redirectURL);
  };
  const handleSubmit = (values, actions) => {
    if (!_.isEmpty(values.build.strategy)) {
      const imageStream =
        values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;
      createOrUpdateResources(values, imageStream, false, false, 'update', appResources)
        .then(() => {
          actions.setSubmitting(false);
          actions.setStatus({ error: '' });
          handleRedirect(namespace);
        })
        .catch((err) => {
          actions.setSubmitting(false);
          actions.setStatus({ error: err.message });
        });
    } else {
      createOrUpdateDeployImageResources(values, false, 'update', appResources)
        .then(() => {
          actions.setSubmitting(false);
          actions.setStatus({ error: '' });
          handleRedirect(namespace);
        })
        .catch((err) => {
          actions.setSubmitting(false);
          actions.setStatus({ error: err.message });
        });
    }
  };
  const renderForm = (props) => {
    return (
      <EditApplicationForm
        {...props}
        enableReinitialize="true"
        pageHeading={pageHeading}
        builderImages={builderImages}
      />
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={
        !_.isEmpty(_.get(initialValues, 'build.strategy'))
          ? validationSchema
          : deployValidationSchema
      }
      render={renderForm}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  const perspective = getActivePerspective(state);
  return {
    perspective,
  };
};

export default connect(mapStateToProps)(EditApplication);
