import type { FC } from 'react';
import {
  Flex,
  FlexItem,
  TextInputTypes,
  Button,
  ButtonVariant,
  ButtonType,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import InputField from '../InputField';
import type {
  TextColumnItemProps,
  TextColumnFieldChildParameterProps,
  MergeNewValueUtil,
} from './text-column-types';

const DEFAULT_CHILDREN = (
  props: TextColumnFieldChildParameterProps,
  mergeNewValue: MergeNewValueUtil,
) => {
  const { name, onChange, ...otherProps } = props;

  return (
    <InputField
      {...otherProps}
      name={name}
      type={TextInputTypes.text}
      onChange={(e) => {
        if (onChange) {
          const values = mergeNewValue(e.target.value);
          onChange(values);
        }
      }}
    />
  );
};

const TextColumnItemContent: FC<TextColumnItemProps> = ({
  name,
  children = DEFAULT_CHILDREN,
  idx,
  isReadOnly,
  placeholder,
  onChange,
  arrayHelpers,
  rowValues,
  disableDeleteRow,
  tooltipDeleteRow,
}) => {
  const { t } = useTranslation();

  const mergeNewValue: MergeNewValueUtil = (newValue) => {
    const values: string[] = [...rowValues];
    values[idx] = newValue;

    return values;
  };

  return (
    <Flex
      alignItems={{ default: 'alignItemsFlexStart' }}
      style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}
    >
      <FlexItem grow={{ default: 'grow' }}>
        {children({ name: `${name}.${idx}`, isReadOnly, placeholder, onChange }, mergeNewValue)}
      </FlexItem>
      {!isReadOnly && (
        <FlexItem>
          <Tooltip content={tooltipDeleteRow || t('console-shared~Remove')}>
            <Button
              icon={<MinusCircleIcon />}
              aria-label={tooltipDeleteRow || t('console-shared~Remove')}
              variant={ButtonVariant.plain}
              type={ButtonType.button}
              isInline
              isDisabled={disableDeleteRow}
              onClick={() => {
                arrayHelpers.remove(idx);
                if (onChange) {
                  const values = [...rowValues];
                  values.splice(idx, 1);
                  onChange(values);
                }
              }}
            />
          </Tooltip>
        </FlexItem>
      )}
    </Flex>
  );
};

export default TextColumnItemContent;
