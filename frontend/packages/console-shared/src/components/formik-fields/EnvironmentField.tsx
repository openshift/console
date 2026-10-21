import type { FC } from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import type { EnvironmentFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const EnvironmentField: FC<EnvironmentFieldProps> = ({
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
  const launchModal = useOverlay();
  const fieldId = getFieldId(props.name, 'env-input');
  const environmentVariables = useMemo(() => {
    return _.isEmpty(envs) ? [['', '']] : envs.map((env) => _.values(env));
  }, [envs]);
  const [nameValue, setNameValue] = useState(environmentVariables);
  const [configMaps, setConfigMaps] = useState({});
  const [secrets, setSecrets] = useState({});
  const handleNameValuePairs = useCallback(
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

  useEffect(() => {
    if (values.formReloadCount) {
      setNameValue(environmentVariables);
    }
    // this effect only handles reload, so we disable dep on environmentVariables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.formReloadCount]);

  useEffect(() => {
    Promise.all([k8sGet(ConfigMapModel, null, namespace), k8sGet(SecretModel, null, namespace)])
      .then(([nsConfigMaps, nsSecrets]) => {
        setConfigMaps(nsConfigMaps);
        setSecrets(nsSecrets);
      })
      .catch(async (err) => {
        if (err?.response?.status !== 403) {
          try {
            await launchModal(ErrorModal, { error: err?.message });
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
      });
  }, [namespace, launchModal]);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
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

      <FormHelperText>
        <HelperText>
          <HelperTextItem>{helpText}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default EnvironmentField;
