import type { FC } from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ClusterExtensionModel } from '@console/internal/models';
import { SchemaFieldHelp } from '@console/shared/src/components/utils/SchemaFieldHelp';

type VersionFieldProps = {
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
};

export const ClusterExtensionVersionField: FC<VersionFieldProps> = ({
  fieldId,
  value,
  onChange,
}) => {
  const { t } = useTranslation('olm-v1');
  return (
    <FormGroup
      fieldId={fieldId}
      label={t('Version or version range')}
      labelHelp={
        <SchemaFieldHelp
          model={ClusterExtensionModel}
          propertyPath="spec.source.catalog.version"
          headerContent={t('Version')}
          ariaLabel={t('Version help')}
          fallbackDescription={t(
            'Specific version or semantic version range to install. If you leave this empty, Operator Lifecycle Manager installs the latest available version.',
          )}
        />
      }
    >
      <TextInput
        id={fieldId}
        aria-label={t('Version or version range')}
        value={value}
        onChange={(_event, nextValue) => onChange(nextValue)}
      />
      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {t('For example, 1.2.3 for an exact version, or >1.2.3 <1.4.5 for a range')}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
