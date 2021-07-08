import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import { connect } from 'react-redux';
import { errorModal } from '@console/internal/components/modals/error-modal';
import { ValueFromPair } from '@console/internal/components/utils/value-from-pair';
import { SecretModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { getFieldId, useFormikValidationFix } from '@console/shared';

interface SecretKeySelectorProps {
  name: string;
  label: string;
  isRequired?: boolean;
}

interface StateProps {
  namespace: string;
}

const SecretKeySelector: React.FC<SecretKeySelectorProps & StateProps> = ({
  name,
  label,
  namespace,
  isRequired = false,
}) => {
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [field, { touched, error }] = useField(name);
  const [secrets, setSecrets] = React.useState({});
  const fieldId = getFieldId(name, 'secret-key-input');
  const isValid = !(touched && error);

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

  React.useEffect(() => {
    k8sGet(SecretModel, null, namespace)
      .then((nsSecrets) => {
        setSecrets(nsSecrets);
      })
      .catch((err) => {
        if (err?.response?.status !== 403) {
          errorModal({ error: err?.message });
        }
      });
  }, [namespace]);

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      isRequired={isRequired}
    >
      <ValueFromPair
        pair={{ secretKeyRef: field.value }}
        secrets={secrets}
        configMaps={{}}
        onChange={(val) => {
          setFieldValue(name, val.target.value.secretKeyRef);
          setFieldTouched(name, true);
        }}
      />
    </FormGroup>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

export default connect<StateProps, null, SecretKeySelectorProps>(mapStateToProps)(
  SecretKeySelector,
);
