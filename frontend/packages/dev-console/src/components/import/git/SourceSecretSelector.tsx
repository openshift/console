import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { getFieldId } from '@console/shared';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';
import { secretModalLauncher } from '../CreateSecretModal';

const CREATE_SOURCE_SECRET = 'create-source-secret';

const SourceSecretSelector: React.FC = () => {
  const { t } = useTranslation();
  const [secret] = useField('git.secret');
  const { values, setFieldValue } = useFormikContext<FormikValues>();

  const handleSave = (name: string) => {
    setFieldValue('git.secret', name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue('git.secret', secret.value);
      secretModalLauncher({
        namespace: values.project.name,
        save: handleSave,
        secretType: SecretTypeAbstraction.source,
      });
    } else {
      setFieldValue('git.secret', key);
    }
  };

  return (
    <>
      <FormGroup
        fieldId={getFieldId('source-secret', 'dropdown')}
        label={t('devconsole~Source Secret')}
        helperText={t('devconsole~Secret with credentials for pulling your source code.')}
      >
        <SourceSecretDropdown
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          namespace={values.project.name}
          actionItems={[
            {
              actionTitle: t('devconsole~Create new Secret'),
              actionKey: CREATE_SOURCE_SECRET,
            },
          ]}
          selectedKey={secret.value}
          title={secret.value}
          onChange={handleDropdownChange}
        />
      </FormGroup>
    </>
  );
};

export default SourceSecretSelector;
