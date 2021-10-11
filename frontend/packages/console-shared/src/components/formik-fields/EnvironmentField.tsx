import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { errorModal } from '@console/internal/components/modals';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
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
  const { setFieldValue, values } = useFormikContext<FormikValues>();
  const { t } = useTranslation();
  const fieldId = getFieldId(props.name, 'env-input');
  const environmentVariables = React.useMemo(() => {
    return !_.isEmpty(envs) ? envs.map((env) => _.values(env)) : [['', '']];
  }, [envs]);
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
    if (values.formReloadCount) {
      setNameValue(environmentVariables);
    }
    // this effect only handles reload, so we disable dep on environmentVariables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.formReloadCount]);

  React.useEffect(() => {
    Promise.all([k8sGet(ConfigMapModel, null, namespace), k8sGet(SecretModel, null, namespace)])
      .then(([nsConfigMaps, nsSecrets]) => {
        setConfigMaps(nsConfigMaps);
        setSecrets(nsSecrets);
      })
      .catch(async (err) => {
        if (err?.response?.status !== 403) {
          try {
            await errorModal({ error: err?.message });
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
      });
  }, [namespace]);

  return (
    <FormGroup fieldId={fieldId} label={label} helperText={helpText} isRequired={required}>
      <NameValueEditor
        nameValuePairs={nameValue}
        valueString={t('console-shared~Value')}
        nameString={t('console-shared~Name')}
        addString={t('console-shared~Add value')}
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
