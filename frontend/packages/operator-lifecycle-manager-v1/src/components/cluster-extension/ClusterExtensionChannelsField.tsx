import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import { ClusterExtensionModel } from '@console/internal/models';
import { SchemaFieldHelp } from '@console/shared/src/components/utils/SchemaFieldHelp';

type ChannelsFieldProps = {
  fieldId: string;
  values: string[];
  onChange: (values: string[]) => void;
};

export const ClusterExtensionChannelsField: FC<ChannelsFieldProps> = ({
  fieldId,
  values,
  onChange,
}) => {
  const { t } = useTranslation('olm-v1');
  return (
    <FormGroup
      fieldId={fieldId}
      label={t('Channels')}
      labelHelp={
        <SchemaFieldHelp
          model={ClusterExtensionModel}
          propertyPath="spec.source.catalog.channels"
          headerContent={t('Channels')}
          ariaLabel={t('Channels help')}
          fallbackDescription={t(
            'Channels that constrain available versions and automatic update paths. If you leave this empty, Operator Lifecycle Manager considers all channels.',
          )}
        />
      }
    >
      <SelectorInput
        isSingleLine
        tags={[...new Set(values)]}
        onChange={onChange}
        placeholder="stable"
        inputProps={{ id: fieldId, 'aria-label': t('Channels') }}
      />
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{t('For example, stable, beta')}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
