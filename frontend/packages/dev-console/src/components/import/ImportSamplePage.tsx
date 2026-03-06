import type { FC } from 'react';
import { useMemo, useCallback } from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ImageStreamModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { SAMPLE_APPLICATION_GROUP } from '../../const';
import type { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import {
  normalizeBuilderImages,
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
} from '../../utils/imagestream-utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { PipelineType } from '../pipeline-section/import-types';
import { defaultRepositoryFormValues } from '../pipeline-section/pipeline/utils';
import { getBaseInitialValues } from './form-initial-values';
import { createOrUpdateResources } from './import-submit-utils';
import type { BaseFormData, GitImportFormData } from './import-types';
import { BuildOptions } from './import-types';
import { detectGitType, validationSchema } from './import-validation-utils';
import ImportSampleForm from './ImportSampleForm';

const ImportSamplePage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const { ns: namespace, is: imageStreamName, isNs: imageStreamNamespace } = useParams();

  const imageStreamResource = useMemo(
    () => ({
      kind: ImageStreamModel.kind,
      isList: false,
      name: imageStreamName,
      namespace: imageStreamNamespace,
    }),
    [imageStreamName, imageStreamNamespace],
  );

  const [imageStream, imageStreamloaded] = useK8sWatchResource(imageStreamResource);

  if (!imageStreamloaded) return <LoadingBox />;

  const { [imageStreamName]: builderImage }: NormalizedBuilderImages = normalizeBuilderImages(
    imageStream,
  );

  const { name: imageName, recentTag: tag } = builderImage;

  const gitUrl = getSampleRepo(tag);
  const gitRef = getSampleRef(tag);
  const gitDir = getSampleContextDir(tag);
  const gitType = detectGitType(gitUrl);

  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, SAMPLE_APPLICATION_GROUP);
  const initialValues: GitImportFormData = {
    ...initialBaseValues,
    name: `${imageName}-sample`,
    application: {
      initial: SAMPLE_APPLICATION_GROUP,
      name: SAMPLE_APPLICATION_GROUP,
      selectedKey: SAMPLE_APPLICATION_GROUP,
    },
    git: {
      url: gitUrl,
      type: gitType,
      ref: gitRef,
      dir: gitDir,
      showGitType: false,
      secret: '',
      isUrlValidating: false,
    },
    docker: {
      dockerfilePath: 'Dockerfile',
    },
    image: {
      ...initialBaseValues.image,
      selected: imageName,
      tag: tag.name,
      tagObj: tag,
    },
    pipeline: {
      enabled: false,
      type: PipelineType.PIPELINE,
    },
    pac: {
      pacHasError: false,
      repository: {
        ...defaultRepositoryFormValues,
      },
    },
    build: {
      ...initialBaseValues.build,
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      option: BuildOptions.BUILDS,
    },
    import: {
      showEditImportStrategy: true,
    },
  };

  const handleSubmit = (values, actions) => {
    const resourceActions = createOrUpdateResources(
      t,
      values,
      imageStream as K8sResourceKind,
      false,
      true,
    ).then(() => createOrUpdateResources(t, values, imageStream as K8sResourceKind));

    return resourceActions
      .then(() => {
        navigate(`/topology/ns/${namespace}`);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <DocumentTitle>{t('devconsole~Create Sample application')}</DocumentTitle>
      <PageHeading title={t('devconsole~Create Sample application')} />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={handleCancel}
        validationSchema={validationSchema(t)}
      >
        {(formikProps) => <ImportSampleForm {...formikProps} builderImage={builderImage} />}
      </Formik>
    </NamespacedPage>
  );
};

export default ImportSamplePage;
