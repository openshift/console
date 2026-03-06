import type { FC } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { FormikProps } from 'formik';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ImageStreamModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sGet } from '@console/internal/module/k8s';
import { usePerspectives } from '@console/shared/src';
import type { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import { normalizeBuilderImages } from '../../utils/imagestream-utils';
import { createOrUpdateDeployImageResources } from '../import/deployImage-submit-utils';
import {
  createOrUpdateResources as createOrUpdateGitResources,
  handleRedirect,
} from '../import/import-submit-utils';
import { useUploadJarFormToast } from '../import/jar/useUploadJarFormToast';
import { createOrUpdateJarFile } from '../import/upload-jar-submit-utils';
import type { EditApplicationProps } from './edit-application-types';
import {
  getFlowType,
  getInitialValues,
  ApplicationFlowType,
  getValidationSchema,
} from './edit-application-utils';
import EditApplicationForm from './EditApplicationForm';

export interface StateProps {
  perspective: string;
}

const EditApplication: FC<EditApplicationProps> = ({
  namespace,
  appName,
  resources: appResources,
}) => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const uploadJarFormToastCallback = useUploadJarFormToast();
  const initialValues = getInitialValues(appResources, appName, namespace);
  const buildStrategy = _.get(initialValues, 'build.strategy', '');
  const buildSourceType = _.get(initialValues, 'build.source.type', undefined);
  const flowType = getFlowType(buildStrategy, buildSourceType);
  const validationSchema = getValidationSchema(buildStrategy, buildSourceType);

  const imageStreamsData = useMemo(
    () =>
      appResources.imageStreams && appResources.imageStreams.loaded
        ? appResources.imageStreams.data
        : [],
    [appResources],
  );

  const [builderImages, setBuilderImages] = useState<NormalizedBuilderImages>(null);

  const updateResources = (values) => {
    if (values.build.strategy) {
      const imageStream =
        values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;
      if (flowType === ApplicationFlowType.JarUpload) {
        const isNewFileUploaded = values.fileUpload.value !== '';
        return createOrUpdateJarFile(
          values,
          imageStream,
          false,
          false,
          'update',
          appResources,
        ).then((resp) => {
          if (isNewFileUploaded) {
            uploadJarFormToastCallback(resp);
          }
          return resp;
        });
      }
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
        handleRedirect(namespace, perspective, perspectiveExtensions, navigate);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  useEffect(() => {
    let ignore = false;

    const getBuilderImages = async () => {
      let allBuilderImages: NormalizedBuilderImages = !_.isEmpty(imageStreamsData)
        ? normalizeBuilderImages(imageStreamsData)
        : {};
      if (appResources.buildConfig.loaded && appResources.buildConfig.data) {
        const {
          name: imageName,
          namespace: imageNs,
        } = appResources.buildConfig.data?.spec?.strategy.sourceStrategy.from;
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

    if (flowType === ApplicationFlowType.Git || flowType === ApplicationFlowType.JarUpload) {
      getBuilderImages();
    }

    return () => {
      ignore = true;
    };
  }, [appResources.buildConfig.data, appResources.buildConfig.loaded, imageStreamsData, flowType]);

  const renderForm = (formikProps: FormikProps<any>) => (
    <EditApplicationForm
      {...formikProps}
      appResources={appResources}
      enableReinitialize
      flowType={flowType}
      builderImages={builderImages}
    />
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleCancel}
      validationSchema={validationSchema(t)}
    >
      {renderForm}
    </Formik>
  );
};

export default EditApplication;
