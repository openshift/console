import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamModel } from '@console/internal/models';
import { useActivePerspective } from '@console/shared';
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
import { getPageHeading, getInitialValues, CreateApplicationFlow } from './edit-application-utils';

export interface StateProps {
  perspective: string;
}

const EditApplication: React.FC<EditApplicationProps> = ({
  namespace,
  appName,
  resources: appResources,
}) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const initialValues = getInitialValues(appResources, appName, namespace);
  const pageHeading = getPageHeading(_.get(initialValues, 'build.strategy', ''));
  const imageStreamsData =
    appResources.imageStreams && appResources.imageStreams.loaded
      ? appResources.imageStreams.data
      : [];

  const [builderImages, setBuilderImages] = React.useState<NormalizedBuilderImages>(null);

  const updateResources = (values) => {
    if (values.build.strategy) {
      const imageStream =
        values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;
      return createOrUpdateGitResources(
        t,
        values,
        imageStream,
        false,
        false,
        'update',
        appResources,
      );
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

  React.useEffect(() => {
    let ignore = false;

    const getBuilderImages = async () => {
      let allBuilderImages: NormalizedBuilderImages = !_.isEmpty(imageStreamsData)
        ? normalizeBuilderImages(imageStreamsData)
        : {};
      if (appResources.buildConfig.loaded) {
        const {
          name: imageName,
          namespace: imageNs,
        } = appResources.buildConfig.data.spec?.strategy.sourceStrategy.from;
        const selectedImage = imageName?.split(':')[0];
        const builderImageExists = imageNs === 'openshift' && allBuilderImages?.[selectedImage];
        if (!builderImageExists) {
          let newImageStream: K8sResourceKind;
          try {
            newImageStream = await k8sGet(ImageStreamModel, selectedImage, imageNs);
            // eslint-disable-next-line no-empty
          } catch {}
          if (ignore) return;
          allBuilderImages = {
            ...allBuilderImages,
            ...(newImageStream ? normalizeBuilderImages(newImageStream) : {}),
          };
        }
      }
      setBuilderImages(!_.isEmpty(allBuilderImages) ? allBuilderImages : null);
    };

    if (pageHeading === CreateApplicationFlow.Git) {
      getBuilderImages();
    }

    return () => {
      ignore = true;
    };
  }, [
    appResources.buildConfig.data.spec,
    appResources.buildConfig.loaded,
    imageStreamsData,
    pageHeading,
  ]);

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

export default EditApplication;
