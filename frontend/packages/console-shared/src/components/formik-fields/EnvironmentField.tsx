import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { FormGroup } from '@patternfly/react-core';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { EnvironmentFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const EnvironmentField: React.FC<EnvironmentFieldProps> = ({
  label,
  helpText,
  required,
  envs,
  ...props
}) => {
  const {
    obj: {
      metadata: { namespace },
    },
  } = props;
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'env-input');
  const environmentVariables = !_.isEmpty(envs) ? envs.map((env) => _.values(env)) : [['', '']];
  const [nameValue, setNameValue] = React.useState(environmentVariables);
  const [configMaps, setConfigMaps] = React.useState({});
  const [secrets, setSecrets] = React.useState({});
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => {
          if (_.isObject(value)) {
            return { name, valueFrom: value };
          }
          if (value.length) {
            return { name, value };
          }
          return null;
        }),
      );
      setNameValue(nameValuePairs);
      setFieldValue(props.name, updatedNameValuePairs);
    },
    [props.name, setFieldValue],
  );
  React.useEffect(() => {
    Promise.all([k8sGet(ConfigMapModel, null, namespace), k8sGet(SecretModel, null, namespace)])
      .then(([nsConfigMaps, nsSecrets]) => {
        setConfigMaps(nsConfigMaps);
        setSecrets(nsSecrets);
      })
      .catch((err) => {
        if (err?.response?.status !== 403) {
          errorModal({ error: err?.message });
        }
      });
  }, [namespace]);

  return (
    <FormGroup fieldId={fieldId} label={label} helperText={helpText} isRequired={required}>
      <NameValueEditor
        nameValuePairs={nameValue}
        valueString="Value"
        nameString="Name"
        addString="Add Value"
        readOnly={false}
        allowSorting={false}
        updateParentData={handleNameValuePairs}
        configMaps={configMaps}
        secrets={secrets}
        addConfigMapSecret
      />
    </FormGroup>
  );
};

export default EnvironmentField;
