import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import { FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { AppResources } from '../edit-application/edit-application-types';
import DeploymentConfigSection from './advanced/DeploymentConfigSection';
import FormSection from './section/FormSection';
import ResourceSection from './section/ResourceSection';

type DeploySectionProps = {
  values: FormikValues;
  appResources?: AppResources;
};

export const DeploySection: React.FC<DeploySectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation();
  return (
    <FormSection title={t('devconsole~Deploy')} fullWidth>
      <ResourceSection />

      <ExpandableSection
        isWidthLimited
        toggleText={t('devconsole~Show advanced Deployment option')}
      >
        <DeploymentConfigSection
          namespace={values.project.name}
          resource={appResources?.editAppResource?.data}
          showHeader={false}
        />
      </ExpandableSection>
    </FormSection>
  );
};
