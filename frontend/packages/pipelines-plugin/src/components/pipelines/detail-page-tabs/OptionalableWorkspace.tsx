import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
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
        aria-label={t('pipelines-plugin~Name')}
      />
      <div style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }} />
      <CheckboxField
        name={`${namePrefix}.optional`}
        label={t('pipelines-plugin~Optional workspace')}
      />
    </>
  );
};

export default OptionalableWorkspace;
