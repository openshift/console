import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { usePreventDataLossLock } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import type { BuilderImage } from '../../../utils/imagestream-utils';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import NamespaceSection from '../NamespaceSection';
import FormSection from '../section/FormSection';
import IconSection from '../section/IconSection';
import ResourceSection from '../section/ResourceSection';
import JarSection from './section/JarSection';

type UploadJarFormProps = {
  namespace: string;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
  builderImage?: BuilderImage;
};

const UploadJarForm: FC<FormikProps<FormikValues> & UploadJarFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  projects,
  builderImage,
}) => {
  const { t } = useTranslation('devconsole');
  usePreventDataLossLock(isSubmitting);
  const {
    image: { tag: selectedImagetag },
  } = values;

  return (
    <FlexForm className="co-deploy-image" data-test-id="upload-jar-form" onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <JarSection />
        <NamespaceSection />
        <IconSection />
        <FormSection>
          {builderImage && selectedImagetag ? (
            <BuilderImageTagSelector
              selectedBuilderImage={builderImage}
              selectedImageTag={selectedImagetag}
              showImageInfo={false}
            />
          ) : (
            <Alert variant="warning" title={t('Unable to detect the Builder Image.')} isInline>
              {t('No associated Builder Image is found for Java.')}
            </Alert>
          )}
        </FormSection>
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
        <ResourceSection />
        <AdvancedSection values={values} />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('Cancel')}
      />
    </FlexForm>
  );
};

export default UploadJarForm;
