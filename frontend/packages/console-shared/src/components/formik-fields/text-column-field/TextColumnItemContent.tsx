import * as React from 'react';
import {
  Flex,
  FlexItem,
  TextInputTypes,
  Button,
  ButtonVariant,
  ButtonType,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon, GripVerticalIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';
import {
  TextColumnItemProps,
  TextColumnFieldChildParameterProps,
  MergeNewValueUtil,
} from './text-column-types';

export type TextColumntItemContentProps = TextColumnItemProps & {
  previewDropRef: (node) => void | null;
  dragRef: (node) => void | null;
  opacity: number;
};

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

const TextColumnItemContent: React.FC<TextColumntItemContentProps> = ({
  name,
  dndEnabled,
  children = DEFAULT_CHILDREN,
  idx,
  isReadOnly,
  placeholder,
  onChange,
  arrayHelpers,
  rowValues,
  disableDeleteRow,
  tooltip,
  previewDropRef,
  dragRef,
  opacity,
}) => {
  const { t } = useTranslation();

  const mergeNewValue: MergeNewValueUtil = (newValue) => {
    const values: string[] = [...rowValues];
    values[idx] = newValue;

    return values;
  };

  return (
    <div ref={previewDropRef} style={{ opacity }}>
      <Flex
        alignItems={{ default: 'alignItemsFlexStart' }}
        style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}
      >
        {dndEnabled && (
          <FlexItem style={{ cursor: 'move' }}>
            <div ref={dragRef}>
              <GripVerticalIcon />
            </div>
          </FlexItem>
        )}
        <FlexItem grow={{ default: 'grow' }}>
          {children({ name: `${name}.${idx}`, isReadOnly, placeholder, onChange }, mergeNewValue)}
        </FlexItem>
        {!isReadOnly && (
          <FlexItem>
            <Tooltip content={tooltip || t('console-shared~Remove')}>
              <Button
                aria-label={tooltip || t('console-shared~Remove')}
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
              >
                <MinusCircleIcon />
              </Button>
            </Tooltip>
          </FlexItem>
        )}
      </Flex>
    </div>
  );
};

export default TextColumnItemContent;
