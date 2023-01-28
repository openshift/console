import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import FormSection from '../section/FormSection';

const ServerlessFunctionStrategySection = ({ builderImages }) => {
  const { values } = useFormikContext<FormikValues>();
  const {
    git: { validated },
  } = values;
  return (
    <FormSection>
      {validated === ValidatedOptions.success && builderImages[values.image.selected] && (
        <BuilderImageTagSelector
          selectedBuilderImage={builderImages[values.image.selected]}
          selectedImageTag={values.image.tag}
        />
      )}
    </FormSection>
  );
};

export default ServerlessFunctionStrategySection;
