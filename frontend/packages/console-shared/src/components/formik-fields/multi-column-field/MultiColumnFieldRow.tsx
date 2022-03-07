import * as React from 'react';
import {
  Tooltip,
  Button,
  ButtonVariant,
  ButtonType,
  GridItem,
  Grid,
  gridItemSpanValueShape,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import './MultiColumnField.scss';

export interface RowRendererProps {
  fieldName: string;
  isReadOnly?: boolean;
  spans: gridItemSpanValueShape[];
  complexFields?: boolean[];
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  onDelete: () => void;
}
export interface MultiColumnFieldRowProps extends Omit<RowRendererProps, 'fieldName'> {
  name: string;
  rowIndex: number;
  children?: React.ReactNode;
  rowRenderer?: (row: RowRendererProps) => React.ReactNode;
}

const DEFAULT_ROW_RENDERER = ({
  fieldName,
  complexFields,
  children,
  isReadOnly,
  spans,
  disableDeleteRow,
  tooltipDeleteRow,
  onDelete,
}): React.ReactNode => {
  const { t } = useTranslation();
  return (
    <div className="odc-multi-column-field__row" data-test={`row ${fieldName}`}>
      <Grid>
        {React.Children.map(children, (child: React.ReactElement, i) => {
          let newProps = child.props;
          if (complexFields[i]) {
            newProps = { ...newProps, namePrefix: fieldName };
          } else {
            newProps = { ...newProps, name: `${fieldName}.${child.props.name}` };
          }
          return (
            <GridItem span={spans[i]} key={fieldName}>
              <div className="odc-multi-column-field__col">
                {React.cloneElement(child, newProps)}
              </div>
            </GridItem>
          );
        })}
      </Grid>
      {!isReadOnly && (
        <div className={'odc-multi-column-field__col--button'}>
          <Tooltip content={tooltipDeleteRow || t('console-shared~Remove')}>
            <Button
              data-test="delete-row"
              aria-label={tooltipDeleteRow || t('console-shared~Remove')}
              variant={ButtonVariant.plain}
              type={ButtonType.button}
              isInline
              onClick={!disableDeleteRow ? onDelete : undefined}
              isAriaDisabled={disableDeleteRow}
            >
              <MinusCircleIcon />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const MultiColumnFieldRow: React.FC<MultiColumnFieldRowProps> = ({
  name,
  rowIndex,
  onDelete,
  children,
  isReadOnly,
  disableDeleteRow,
  tooltipDeleteRow,
  spans,
  complexFields = [],
  rowRenderer = DEFAULT_ROW_RENDERER,
}) => {
  const fieldName = `${name}.${rowIndex}`;
  return (
    <>
      {rowRenderer({
        fieldName,
        complexFields,
        children,
        isReadOnly,
        spans,
        disableDeleteRow,
        tooltipDeleteRow,
        onDelete,
      })}
    </>
  );
};

export default MultiColumnFieldRow;
