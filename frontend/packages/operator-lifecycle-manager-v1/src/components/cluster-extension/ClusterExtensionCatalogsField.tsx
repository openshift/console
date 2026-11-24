import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import { ClusterExtensionModel } from '@console/internal/models';
import { SchemaFieldHelp } from '@console/shared/src/components/utils/SchemaFieldHelp';

type CatalogsFieldProps = {
  fieldId: string;
  values: string[];
  onChange: (values: string[]) => void;
};

export const ClusterExtensionCatalogsField: FC<CatalogsFieldProps> = ({
  fieldId,
  values,
  onChange,
}) => {
  const { t } = useTranslation('olm-v1');
  return (
    <FormGroup
      fieldId={fieldId}
      label={t('Catalogs')}
      labelHelp={
        <SchemaFieldHelp
          model={ClusterExtensionModel}
          propertyPath="spec.source.catalog.selector"
          headerContent={t('Catalogs')}
          ariaLabel={t('Catalogs help')}
          fallbackDescription={t(
            'Catalogs to use when selecting the Operator package. If you leave this empty, Operator Lifecycle Manager searches all catalogs.',
          )}
        />
      }
    >
      <SelectorInput
        isSingleLine
        tags={[...new Set(values)]}
        onChange={onChange}
        placeholder="redhat-operators"
        inputProps={{ id: fieldId, 'aria-label': t('Catalogs') }}
      />
      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {t('Package will only be resolved from specified catalogs.')}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
