import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext, useField } from 'formik';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { ValueFromPair } from '@console/internal/components/utils/value-from-pair';
import { SecretModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { getFieldId } from '@console/shared/src/components/formik-fields/field-utils';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useFormikValidationFix } from '@console/shared/src/hooks/useFormikValidationFix';

interface SecretKeySelectorProps {
  name: string;
  label: string;
  isRequired?: boolean;
}

const SecretKeySelector: FC<SecretKeySelectorProps> = ({ name, label, isRequired = false }) => {
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [field, { touched, error }] = useField(name);
  const [secrets, setSecrets] = useState({});
  const launchModal = useOverlay();
  const fieldId = getFieldId(name, 'secret-key-input');
  const isValid = !(touched && error);
  const [namespace] = useActiveNamespace();

  const getErrorMessage = (err: string | { name?: string; key?: string }): string => {
    let errMsg = '';
    if (typeof err === 'string') {
      errMsg = err;
    } else {
      errMsg = err?.name || err?.key;
    }
    return errMsg;
  };
  const errorMessage = !isValid ? getErrorMessage(error) : '';

  useFormikValidationFix(field.value);

  useEffect(() => {
    k8sGet(SecretModel, null, namespace)
      .then((nsSecrets) => {
        setSecrets(nsSecrets);
      })
      .catch((err) => {
        if (err?.response?.status !== 403) {
          launchModal(ErrorModal, { error: err?.message });
        }
      });
  }, [namespace, launchModal]);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={isRequired}>
      <ValueFromPair
        pair={{ secretKeyRef: field.value }}
        secrets={secrets}
        configMaps={{}}
        onChange={(val) => {
          setFieldValue(name, val.target.value.secretKeyRef);
          setFieldTouched(name, true);
        }}
      />

      {!isValid && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default SecretKeySelector;
