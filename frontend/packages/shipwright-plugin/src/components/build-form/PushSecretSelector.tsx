import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useCreateSecretModal } from '@console/dev-console/src/components/import/CreateSecretModal';
import { SecretFormType } from '@console/internal/components/secrets/create-secret';
import { getFieldId } from '@console/shared';
import PushSecretDropdown from './PushSecretDropdown';

const CREATE_PULL_SECRET = 'create-pull-secret';
const CLEAR_PULL_SECRET = 'clear-pull-secret';

const PushSecretSelector: FC<{
  formContextField?: string;
  namespace: string;
}> = ({ formContextField, namespace }) => {
  const fieldPrefix = formContextField ? `${formContextField}` : '';

  const { t } = useTranslation();
  const launchCreateSecretModal = useCreateSecretModal();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const secret: string = _.get(values, `${fieldPrefix}`);

  const handleSave = (name: string) => {
    setFieldValue(`${fieldPrefix}`, name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_PULL_SECRET) {
      setFieldValue(`${fieldPrefix}`, secret);
      launchCreateSecretModal({
        namespace,
        save: handleSave,
        formType: SecretFormType.image,
      });
    } else if (key === CLEAR_PULL_SECRET) {
      setFieldValue(`${fieldPrefix}`, '');
    } else {
      setFieldValue(`${fieldPrefix}`, key);
    }
  };

  return (
    <>
      <FormGroup
        fieldId={getFieldId('source-secret', 'dropdown')}
        label={t('shipwright-plugin~Push Secret')}
      >
        <PushSecretDropdown
          name={`${fieldPrefix}`}
          isFullWidth
          menuClassName="dropdown-menu--text-wrap"
          namespace={namespace}
          actionItems={[
            {
              actionTitle: t('shipwright-plugin~Create new Secret'),
              actionKey: CREATE_PULL_SECRET,
            },
            {
              actionTitle: t('shipwright-plugin~No Secret'),
              actionKey: CLEAR_PULL_SECRET,
            },
          ]}
          selectedKey={secret}
          title={secret}
          onChange={handleDropdownChange}
        />

        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t('shipwright-plugin~Secret with credentials for pushing build')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </>
  );
};

export default PushSecretSelector;
