import * as React from 'react';
import { Alert, ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ServerlessBuildStrategyType } from '@console/knative-plugin/src';
import { notSupportedRuntime } from '../../../utils/serverless-functions';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import FormSection from '../section/FormSection';

const ServerlessFunctionStrategySection = ({ builderImages }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();
  const {
    git: { validated },
    build: { strategy },
  } = values;
  return (
    <FormSection>
      {validated === ValidatedOptions.success && builderImages[values.image.selected] && (
        <BuilderImageTagSelector
          selectedBuilderImage={builderImages[values.image.selected]}
          selectedImageTag={values.image.tag}
        />
      )}
      {validated !== ValidatedOptions.warning &&
        strategy === ServerlessBuildStrategyType.ServerlessFunction &&
        notSupportedRuntime.indexOf(values.image.selected) === -1 &&
        builderImages[values.image.selected] === undefined && (
          <Alert
            variant="warning"
            isInline
            title={t('devconsole~Builder Image {{image}} is not present.', {
              image: values.image.selected,
            })}
          >
            <p>{t('devconsole~Builder image is not present on cluster')}</p>
          </Alert>
        )}
      {validated !== ValidatedOptions.warning &&
        strategy === ServerlessBuildStrategyType.ServerlessFunction &&
        notSupportedRuntime.indexOf(values.image.selected) > -1 && (
          <Alert
            variant="warning"
            isInline
            title={t('devconsole~Support for Builder image {{image}} is not yet available.', {
              image: values.image.selected,
            })}
          />
        )}
    </FormSection>
  );
};

export default ServerlessFunctionStrategySection;
