import * as React from 'react';
import { Alert, Button, AlertActionCloseButton } from '@patternfly/react-core';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { safeYAMLToJS, safeJSToYAML } from '../../utils/yaml';
import { EditorType } from '../synced-editor/editor-toggle';
import RadioGroupField from './RadioGroupField';

import './SyncedEditorField.scss';

type FormErrorCallback<ReturnValue = {}> = () => ReturnValue;
type WithOrWithoutPromise<Type> = Promise<Type> | Type;
export type SanitizeToForm<YAMLStruct = {}, FormOutput = {}> = (
  preFormData: YAMLStruct,
) => WithOrWithoutPromise<FormOutput | FormErrorCallback<FormOutput>>;
export type SanitizeToYAML = (preFormData: string) => string;

type EditorContext<SanitizeTo> = {
  name: string;
  editor: React.ReactNode;
  isDisabled?: boolean;
  sanitizeTo?: SanitizeTo;
  label?: string;
};

type SyncedEditorFieldProps = {
  name: string;
  formContext: EditorContext<SanitizeToForm>;
  yamlContext: EditorContext<SanitizeToYAML>;
  noMargin?: boolean;
};

const SyncedEditorField: React.FC<SyncedEditorFieldProps> = ({
  name,
  formContext,
  yamlContext,
  noMargin = false,
}) => {
  const [field] = useField(name);
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const { t } = useTranslation();

  const formData = _.get(values, formContext.name);
  const yamlData: string = _.get(values, yamlContext.name);

  const [yamlWarning, setYAMLWarning] = React.useState<boolean>(false);
  const [sanitizeToCallback, setSanitizeToCallback] = React.useState<FormErrorCallback>(undefined);
  const [disabledFormAlert, setDisabledFormAlert] = React.useState<boolean>(formContext.isDisabled);

  const changeEditorType = (newType: EditorType): void => {
    setFieldValue(name, newType);
  };

  const handleToggleToForm = async () => {
    // Convert from YAML
    let content = safeYAMLToJS(yamlData);

    // Sanitize the YAML structure if possible
    if (!_.isEmpty(content)) {
      if (formContext.sanitizeTo) {
        try {
          content = await formContext.sanitizeTo(content);
        } catch (e) {
          // Failed to sanitize, discard invalid data
          content = null;
        }
      }

      // Handle sanitized result
      if (typeof content === 'object' && !_.isEmpty(content)) {
        setFieldValue(formContext.name, content);
        changeEditorType(EditorType.Form);
        return;
      }
      if (typeof content === 'function') {
        setSanitizeToCallback(() => content);
      }
    }

    setYAMLWarning(true);
  };

  const handleToggleToYAML = () => {
    const newYAML = safeJSToYAML(formData, yamlData, { skipInvalid: true });
    setFieldValue(
      yamlContext.name,
      yamlContext.sanitizeTo ? yamlContext.sanitizeTo(newYAML) : newYAML,
    );
    changeEditorType(EditorType.YAML);
  };

  const onClickYAMLWarningConfirm = async () => {
    setYAMLWarning(false);
    if (sanitizeToCallback) {
      setFieldValue(formContext.name, sanitizeToCallback());
    }
    changeEditorType(EditorType.Form);
  };

  const onClickYAMLWarningCancel = () => {
    setYAMLWarning(false);
  };

  const onChangeType = (newType: EditorType) => {
    switch (newType) {
      case EditorType.YAML:
        handleToggleToYAML();
        break;
      case EditorType.Form:
        handleToggleToForm();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    setDisabledFormAlert(formContext.isDisabled);
  }, [formContext.isDisabled]);

  return (
    <>
      <div
        className={cx('ocs-synced-editor-field__editor-toggle', { margin: !noMargin })}
        data-test="synced-editor-field"
      >
        <RadioGroupField
          label={t('console-shared~Configure via:')}
          name={name}
          options={[
            {
              label: formContext.label || t('console-shared~Form view'),
              value: EditorType.Form,
              isDisabled: formContext.isDisabled,
            },
            {
              label: yamlContext.label || t('console-shared~YAML view'),
              value: EditorType.YAML,
              isDisabled: yamlContext.isDisabled,
            },
          ]}
          onChange={(val: string) => onChangeType(val as EditorType)}
          isInline
        />
      </div>
      {yamlWarning && (
        <Alert
          className="co-synced-editor__yaml-warning"
          variant="danger"
          isInline
          title={t('console-shared~Invalid YAML cannot be persisted')}
        >
          <p>{t('console-shared~Switching to form view will delete any invalid YAML.')}</p>
          <Button variant="danger" onClick={onClickYAMLWarningConfirm}>
            {t('console-shared~Switch and delete')}
          </Button>
          &nbsp;
          <Button variant="secondary" onClick={onClickYAMLWarningCancel}>
            {t('console-shared~Cancel')}
          </Button>
        </Alert>
      )}
      {disabledFormAlert && (
        <Alert
          variant="default"
          title={t(
            'console-shared~Form view is disabled for this chart because the schema is not available',
          )}
          actionClose={<AlertActionCloseButton onClose={() => setDisabledFormAlert(false)} />}
          isInline
        />
      )}
      {field.value === EditorType.Form ? formContext.editor : yamlContext.editor}
    </>
  );
};

export default SyncedEditorField;
