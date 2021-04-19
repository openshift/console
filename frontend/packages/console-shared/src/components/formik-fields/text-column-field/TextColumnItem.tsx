import * as React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useTranslation } from 'react-i18next';
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
import { InputField } from '@console/shared';
import { TextColumnItemProps, ItemTypes, DragItem } from './text-column-types';

const TextColumnItem: React.FC<TextColumnItemProps> = ({
  idx,
  name,
  tooltip,
  placeholder,
  isReadOnly,
  onChange,
  rowValues,
  disableDeleteRow,
  arrayHelpers,
  dndEnabled = false,
}) => {
  const { t } = useTranslation();
  const [, drag, preview] = useDrag({
    item: { type: ItemTypes.TextColumn, id: `${ItemTypes.TextColumn}-${idx}`, idx },
  });
  const [{ opacity }, drop] = useDrop({
    accept: ItemTypes.TextColumn,
    collect: (monitor) => ({
      opacity: monitor.isOver() ? 0 : 1,
    }),
    hover(item: DragItem) {
      if (item.idx === idx) {
        return;
      }
      arrayHelpers.swap(item.idx, idx);
      if (onChange) {
        const values = [...rowValues];
        [values[idx], values[item.idx]] = [values[item.idx], values[idx]];
        onChange(values);
      }
      // monitor item updated here to avoid expensive index searches.
      item.idx = idx;
    },
  });

  return (
    <div ref={(node) => preview(drop(node))} style={{ opacity }}>
      <Flex style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}>
        {dndEnabled && (
          <FlexItem style={{ cursor: 'move' }}>
            <div ref={drag}>
              <GripVerticalIcon />
            </div>
          </FlexItem>
        )}
        <FlexItem grow={{ default: 'grow' }}>
          <InputField
            type={TextInputTypes.text}
            name={`${name}.${idx}`}
            placeholder={placeholder}
            isReadOnly={isReadOnly}
            onChange={(e) => {
              if (onChange) {
                const values = [...rowValues];
                values[idx] = e.target.value;
                onChange(values);
              }
            }}
          />
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

export default TextColumnItem;
