import * as React from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField, DropdownField, TextColumnField } from '@console/shared';
import FormSection from '../../import/section/FormSection';
import EditorField from './EditorField';

type HookFormData = {
  enabled: boolean;
  type: 'command' | 'shell' | 'onlyArgs';
  commands: string[];
  shell: string;
  arguments: string[];
};

export type HooksSectionFormData = { formData: { hooks: HookFormData } };

const HooksSection: React.FC<{}> = () => {
  const { t } = useTranslation();

  const [
    {
      value: { enabled, type, commands },
    },
  ] = useField<HookFormData>('formData.hooks');

  const hookTypeItems: Record<string, string> = {
    command: t('devconsole~Command'),
    shell: t('devconsole~Shell script'),
    onlyArgs: t('devconsole~Arguments to default image entry point'),
  };

  const lineHeight = 18;
  return (
    <FormSection title={t('devconsole~Hooks')} dataTest="section hooks">
      <CheckboxField
        name="formData.hooks.enabled"
        label={t('devconsole~Run build hooks after image is built')}
        helpText={t(
          'devconsole~Build hooks allow you to run commands at the end of the build to verify the image.',
        )}
      />

      {enabled ? (
        <DropdownField
          name="formData.hooks.type"
          label={t('devconsole~Hook type')}
          items={hookTypeItems}
          fullWidth
          dataTest="type"
        />
      ) : null}

      {enabled && type === 'shell' ? (
        <EditorField
          name="formData.hooks.shell"
          label={t('devconsole~Script')}
          height={15 * lineHeight}
          theme="console"
          options={{
            lineHeight,
            readOnly: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      ) : null}

      {enabled && type === 'command' ? (
        <TextColumnField
          name="formData.hooks.commands"
          label={t('devconsole~Command')}
          addLabel={t('devconsole~Add command')}
          placeholder={t('devconsole~Command')}
          helpText={t(
            'devconsole~Enter the command to run inside the container. The command is considered successful if its exit code is 0.',
          )}
          disableDeleteRow={commands?.length === 1}
        />
      ) : null}

      {enabled && (type === 'shell' || type === 'command' || type === 'onlyArgs') ? (
        <TextColumnField
          name="formData.hooks.arguments"
          label={t('devconsole~Arguments')}
          addLabel={t('devconsole~Add argument')}
          placeholder={t('devconsole~Argument')}
          helpText={t('devconsole~Enter the arguments that will be appended to the command.')}
        />
      ) : null}
    </FormSection>
  );
};

export default HooksSection;
