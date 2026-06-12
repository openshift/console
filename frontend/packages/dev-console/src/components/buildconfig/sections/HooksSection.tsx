import type { FC } from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { TextColumnField } from '@console/shared/src/components/formik-fields/text-column-field/TextColumnField';
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

const HooksSection: FC<{}> = () => {
  const { t } = useTranslation('devconsole');

  const [
    {
      value: { enabled, type, commands },
    },
  ] = useField<HookFormData>('formData.hooks');

  const hookTypeItems: Record<string, string> = {
    command: t('Command'),
    shell: t('Shell script'),
    onlyArgs: t('Arguments to default image entry point'),
  };

  const lineHeight = 18;
  return (
    <FormSection title={t('Hooks')} dataTest="section hooks">
      <CheckboxField
        name="formData.hooks.enabled"
        label={t('Run build hooks after image is built')}
        helpText={t(
          'devconsole~Build hooks allow you to run commands at the end of the build to verify the image.',
        )}
      />

      {enabled ? (
        <DropdownField
          name="formData.hooks.type"
          label={t('Hook type')}
          items={hookTypeItems}
          fullWidth
          dataTest="type"
        />
      ) : null}

      {enabled && type === 'shell' ? (
        <EditorField
          name="formData.hooks.shell"
          label={t('Script')}
          options={{
            lineHeight,
            scrollBeyondLastLine: false,
          }}
        />
      ) : null}

      {enabled && type === 'command' ? (
        <TextColumnField
          name="formData.hooks.commands"
          label={t('Command')}
          addLabel={t('Add command')}
          placeholder={t('Command')}
          helpText={t(
            'devconsole~Enter the command to run inside the container. The command is considered successful if its exit code is 0.',
          )}
          disableDeleteRow={commands?.length === 1}
        />
      ) : null}

      {enabled && (type === 'shell' || type === 'command' || type === 'onlyArgs') ? (
        <TextColumnField
          name="formData.hooks.arguments"
          label={t('Arguments')}
          addLabel={t('Add argument')}
          placeholder={t('Argument')}
          helpText={t('Enter the arguments that will be appended to the command.')}
        />
      ) : null}
    </FormSection>
  );
};

export default HooksSection;
