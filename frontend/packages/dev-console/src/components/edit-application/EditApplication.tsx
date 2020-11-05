import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { history } from '@console/internal/components/utils';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import {
  createOrUpdateResources as createOrUpdateGitResources,
  handleRedirect,
} from '../import/import-submit-utils';
import { validationSchema as gitValidationSchema } from '../import/import-validation-utils';
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
  const { t } = useTranslation();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const imageStreamsData =
    appResources.imageStreams && appResources.imageStreams.loaded
      ? appResources.imageStreams.data
      : [];
  const builderImages: NormalizedBuilderImages = !_.isEmpty(imageStreamsData)
    ? normalizeBuilderImages(imageStreamsData)
    : null;

  const initialValues = getInitialValues(appResources, appName, namespace);
  const pageHeading = getPageHeading(_.get(initialValues, 'build.strategy', ''));

  const updateResources = (values) => {
    if (values.build.strategy) {
      const imageStream =
        values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;
      return createOrUpdateGitResources(values, imageStream, false, false, 'update', appResources);
    }
    return createOrUpdateDeployImageResources(values, false, 'update', appResources);
  };

  const handleSubmit = (values, actions) => {
    return updateResources(values)
      .then(() => {
        actions.setStatus({ submitError: '' });
        handleRedirect(namespace, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (formikProps: FormikProps<any>) => {
    return (
      <EditApplicationForm
        {...formikProps}
        appResources={appResources}
        enableReinitialize
        createFlowType={pageHeading}
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
        _.get(initialValues, 'build.strategy') ? gitValidationSchema(t) : deployValidationSchema(t)
      }
    >
      {renderForm}
    </Formik>
  );
};

const mapStateToProps = (state: RootState) => {
  const perspective = getActivePerspective(state);
  return {
    perspective,
  };
};

export default connect(mapStateToProps)(EditApplication);
