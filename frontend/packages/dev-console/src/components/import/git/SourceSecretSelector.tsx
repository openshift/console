import type { FC } from 'react';
import { useEffect } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useCreateSecretModal } from '@console/dev-console/src/components/import/CreateSecretModal';
import { SecretFormType } from '@console/internal/components/secrets/create-secret';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { getFieldId } from '@console/shared';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';

const CREATE_SOURCE_SECRET = 'create-source-secret';
const CLEAR_SOURCE_SECRET = 'clear-source-secret';

const SourceSecretSelector: FC<{
  formContextField?: string;
}> = ({ formContextField }) => {
  const fieldPrefix = formContextField ? `${formContextField}.` : '';

  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const launchCreateSecretModal = useCreateSecretModal();
  const namespace: string = _.get(values, `${fieldPrefix}project.name`);
  const secret: string = _.get(values, `${fieldPrefix}git.secret`);
  const [data, loaded, loadError] = useK8sWatchResource(
    namespace && secret
      ? {
          kind: SecretModel.kind,
          namespace,
          name: secret,
          optional: true,
          isList: false,
        }
      : null,
  );

  const handleSave = (name: string) => {
    setFieldValue(`${fieldPrefix}git.secret`, name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue(`${fieldPrefix}git.secret`, secret);
      launchCreateSecretModal({
        namespace,
        save: handleSave,
        formType: SecretFormType.source,
      });
    } else if (key === CLEAR_SOURCE_SECRET) {
      setFieldValue(`${fieldPrefix}git.secret`, '');
      setFieldValue(`${fieldPrefix}git.secretResource`, {});
    } else {
      setFieldValue(`${fieldPrefix}git.secret`, key);
    }
  };

  useEffect(() => {
    loaded &&
      !loadError &&
      secret &&
      data &&
      setFieldValue(`${fieldPrefix}git.secretResource`, data);
  }, [loaded, loadError, secret, data, setFieldValue, fieldPrefix]);

  return (
    <FormGroup
      fieldId={getFieldId('source-secret', 'dropdown')}
      label={t('devconsole~Source Secret')}
    >
      <SourceSecretDropdown
        isFullWidth
        menuClassName="dropdown-menu--text-wrap"
        namespace={namespace}
        actionItems={[
          {
            actionTitle: t('devconsole~Create new Secret'),
            actionKey: CREATE_SOURCE_SECRET,
          },
          {
            actionTitle: t('devconsole~No Secret'),
            actionKey: CLEAR_SOURCE_SECRET,
          },
        ]}
        selectedKey={secret}
        title={secret}
        onChange={handleDropdownChange}
      />

      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {t('devconsole~Secret with credentials for pulling your source code.')}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default SourceSecretSelector;
