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

type EditorContext = {
  name: string;
  editor: React.ReactNode;
  isDisabled?: boolean;
  sanitizeTo?: (preFormData: any) => any;
  label?: string;
};

type SyncedEditorFieldProps = {
  name: string;
  formContext: EditorContext;
  yamlContext: EditorContext;
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
  const yamlData = _.get(values, yamlContext.name);

  const [yamlWarning, setYAMLWarning] = React.useState<boolean>(false);
  const [disabledFormAlert, setDisabledFormAlert] = React.useState<boolean>(formContext.isDisabled);

  const changeEditorType = (newType: EditorType): void => {
    setFieldValue(name, newType);
  };

  const handleToggleToForm = () => {
    const newFormData = safeYAMLToJS(yamlData);
    if (!_.isEmpty(newFormData)) {
      changeEditorType(EditorType.Form);
      setFieldValue(
        formContext.name,
        formContext.sanitizeTo ? formContext.sanitizeTo(newFormData) : newFormData,
      );
    } else {
      setYAMLWarning(true);
    }
  };

  const handleToggleToYAML = () => {
    const newYAML = safeJSToYAML(formData, yamlData, { skipInvalid: true });
    setFieldValue(
      yamlContext.name,
      yamlContext.sanitizeTo ? yamlContext.sanitizeTo(newYAML) : newYAML,
    );
    changeEditorType(EditorType.YAML);
  };

  const onClickYAMLWarningConfirm = () => {
    setYAMLWarning(false);
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
      <div className={cx('ocs-synced-editor-field__editor-toggle', { margin: !noMargin })}>
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
