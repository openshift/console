import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { getFieldId } from '@console/shared';
import SourceSecretDropdown from '../../dropdown/SourceSecretDropdown';
import { secretModalLauncher } from '../CreateSecretModal';

const CREATE_SOURCE_SECRET = 'create-source-secret';

const SourceSecretSelector: React.FC<{
  formContextField?: string;
}> = ({ formContextField }) => {
  const fieldPrefix = formContextField ? `${formContextField}.` : '';

  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const namespace: string = _.get(values, `${fieldPrefix}project.name`);
  const secret: string = _.get(values, `${fieldPrefix}git.secret`);
  const [data, loaded, loadError] = useK8sWatchResource({
    kind: SecretModel.kind,
    namespace,
    name: secret,
    optional: true,
    isList: false,
  });

  const handleSave = (name: string) => {
    setFieldValue(`${fieldPrefix}git.secret`, name);
  };

  const handleDropdownChange = (key: string) => {
    if (key === CREATE_SOURCE_SECRET) {
      setFieldValue(`${fieldPrefix}git.secret`, secret);
      secretModalLauncher({
        namespace,
        save: handleSave,
        secretType: SecretTypeAbstraction.source,
      });
    } else {
      setFieldValue(`${fieldPrefix}git.secret`, key);
    }
  };

  React.useEffect(() => {
    loaded &&
      !loadError &&
      secret &&
      data &&
      setFieldValue(`${fieldPrefix}git.secretResource`, data);
  }, [loaded, loadError, secret, data, setFieldValue, fieldPrefix]);

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
          namespace={namespace}
          actionItems={[
            {
              actionTitle: t('devconsole~Create new Secret'),
              actionKey: CREATE_SOURCE_SECRET,
            },
          ]}
          selectedKey={secret}
          title={secret}
          onChange={handleDropdownChange}
        />
      </FormGroup>
    </>
  );
};

export default SourceSecretSelector;
