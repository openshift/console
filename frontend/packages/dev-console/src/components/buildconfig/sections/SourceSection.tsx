import * as React from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared';
import GitSection, { GitSectionFormData } from '../../import/git/GitSection';
import FormSection from '../../import/section/FormSection';
import EditorField from './EditorField';

type Type = 'none' | 'git' | 'dockerfile' | 'binary';

export type SourceSectionFormData = {
  formData: {
    source: {
      type: Type;
      git: GitSectionFormData;
      dockerfile: string;
    };
  };
};

const SourceSection: React.FC<{}> = () => {
  const { t } = useTranslation();

  const [, meta] = useField<string>('formData.name');
  const isNew = !meta.initialValue;

  const [{ value: type }] = useField<Type>('formData.source.type');

  const typeItems: Record<string, string> = {
    git: t('devconsole~Git'),
    dockerfile: t('devconsole~Dockerfile'),
    binary: t('devconsole~Binary'),
  };

  const lineHeight = 18;
  const showLines = 10; // Math.max(3, Math.min(15, dockerfile?.split('/n')?.length));
  const height = lineHeight * showLines;

  return (
    <FormSection title={t('devconsole~Source')} dataTest="section source">
      {isNew || (type !== 'git' && type !== 'dockerfile' && type !== 'binary') ? (
        <DropdownField
          name="formData.source.type"
          label={t('devconsole~Source type')}
          title={t('devconsole~Please select your source type')}
          items={typeItems}
          helpText={t('devconsole~Source could be a git repository or Dockerfile')}
          required
          fullWidth
        />
      ) : null}

      {type === 'git' ? <GitSection title="" formContextField="formData.source.git" /> : null}

      {type === 'dockerfile' ? (
        <EditorField
          name="formData.source.dockerfile"
          label={t('devconsole~Dockerfile')}
          height={height}
          language="dockerfile"
          theme="console"
          options={{
            lineHeight,
            readOnly: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      ) : null}

      {type === 'binary' ? (
        <div>{t('devconsole~There are no editable source types for this build config.')}</div>
      ) : null}
    </FormSection>
  );
};

export default SourceSection;
