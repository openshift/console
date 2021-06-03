import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import { CheckboxField, InputField } from '@console/shared';

type OptionalableWorkspace = {
  namePrefix?: string;
  isReadOnly?: boolean;
};

const OptionalableWorkspace: React.FC<OptionalableWorkspace> = ({ namePrefix, isReadOnly }) => {
  const { t } = useTranslation();

  return (
    <>
      <InputField
        data-test="name"
        name={`${namePrefix}.name`}
        type={TextInputTypes.text}
        placeholder={t('pipelines-plugin~Name')}
        isReadOnly={isReadOnly}
      />
      <div style={{ marginBottom: 'var(--pf-global--spacer--xs)' }} />
      <CheckboxField
        name={`${namePrefix}.optional`}
        label={t('pipelines-plugin~Optional workspace')}
      />
    </>
  );
};

export default OptionalableWorkspace;
