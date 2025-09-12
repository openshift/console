import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { usePerspectives } from '@console/shared/src';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { createOrUpdateDeployImageResources } from '../import/deployImage-submit-utils';
import {
  createOrUpdateResources as createOrUpdateGitResources,
  handleRedirect,
} from '../import/import-submit-utils';
import { useUploadJarFormToast } from '../import/jar/useUploadJarFormToast';
import { createOrUpdateJarFile } from '../import/upload-jar-submit-utils';
import { AppResources, EditApplicationProps } from './edit-application-types';
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

const EditApplication: React.FC<EditApplicationProps> = ({
  namespace,
  appName,
  resources: appResources,
}) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const uploadJarFormToastCallback = useUploadJarFormToast();
  const initialValues = getInitialValues(appResources as AppResources, appName, namespace);
  const buildStrategy = _.get(initialValues, 'build.strategy', '');
  const buildSourceType = _.get(initialValues, 'build.source.type', undefined);
  const flowType = getFlowType(buildStrategy, buildSourceType);
  const validationSchema = getValidationSchema(buildStrategy, buildSourceType);

  const imageStreamsData = React.useMemo(
    () =>
      appResources?.imageStreams && appResources?.imageStreams.loaded
        ? appResources?.imageStreams.data
        : [],
    [appResources],
  );

  const [builderImages, setBuilderImages] = React.useState<NormalizedBuilderImages | null>(null);

  const updateResources = (values) => {
    if (values.build.strategy) {
      const imageStream =
        values.image.selected && builderImages ? builderImages[values.image.selected].obj : null;
      if (flowType === ApplicationFlowType.JarUpload) {
        const isNewFileUploaded = values.fileUpload.value !== '';
        return createOrUpdateJarFile(
          values,
          imageStream as K8sResourceKind,
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
        imageStream as K8sResourceKind,
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

  React.useEffect(() => {
    let ignore = false;

    const getBuilderImages = async () => {
      let allBuilderImages: NormalizedBuilderImages = !_.isEmpty(imageStreamsData)
        ? normalizeBuilderImages(imageStreamsData)
        : {};
      if (appResources?.buildConfig?.loaded && appResources?.buildConfig?.data) {
        const {
          name: imageName,
          namespace: imageNs,
        } = appResources?.buildConfig.data?.[0]?.spec?.strategy.sourceStrategy.from;
        const selectedImage = imageName?.split(':')[0];
        const builderImageExists = imageNs === 'openshift' && allBuilderImages?.[selectedImage];
        if (!builderImageExists) {
          let newImageStream: K8sResourceKind | undefined;
          try {
            newImageStream = await k8sGet(ImageStreamModel, selectedImage, imageNs);
            // eslint-disable-next-line no-empty
          } catch {}
          if (ignore) return;
          allBuilderImages = {
            ...allBuilderImages,
            ...(newImageStream ? normalizeBuilderImages(newImageStream as K8sResourceKind) : {}),
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
  }, [
    appResources?.buildConfig?.data,
    appResources?.buildConfig?.loaded,
    imageStreamsData,
    flowType,
  ]);

  const renderForm = (formikProps: FormikProps<any>) => (
    <EditApplicationForm
      {...formikProps}
      appResources={appResources as AppResources}
      enableReinitialize
      flowType={flowType}
      builderImages={builderImages as NormalizedBuilderImages | undefined}
    />
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(t)}
    >
      {renderForm}
    </Formik>
  );
};

export default EditApplication;
