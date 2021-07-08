import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { usePreventDataLossLock } from '@console/internal/components/utils';
import { WatchK8sResultsObject } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FlexForm, FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import { BuilderImage } from '../../../utils/imagestream-utils';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import FormSection from '../section/FormSection';
import IconSection from '../section/IconSection';
import ResourceSection from '../section/ResourceSection';
import JarSection from './section/JarSection';

export type UploadJarFormProps = {
  namespace: string;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
  builderImage: BuilderImage;
};

const UploadJarForm: React.FunctionComponent<FormikProps<FormikValues> & UploadJarFormProps> = ({
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
  const { t } = useTranslation();
  usePreventDataLossLock(isSubmitting);
  const {
    image: { tag: selectedImagetag },
  } = values;

  return (
    <FlexForm className="co-deploy-image" data-test-id="upload-jar-form" onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <JarSection />
        <IconSection />
        <FormSection>
          <BuilderImageTagSelector
            selectedBuilderImage={builderImage}
            selectedImageTag={selectedImagetag}
            showImageInfo={false}
          />
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
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </FlexForm>
  );
};

export default UploadJarForm;
