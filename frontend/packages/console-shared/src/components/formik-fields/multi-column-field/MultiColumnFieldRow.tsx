import type { ReactNode, ReactElement, FC } from 'react';
import { Children, cloneElement } from 'react';
import type { gridItemSpanValueShape } from '@patternfly/react-core';
import { Tooltip, Button, ButtonVariant, ButtonType, GridItem, Grid } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
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
  children?: ReactNode;
  rowRenderer?: (row: RowRendererProps) => ReactNode;
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
}): ReactNode => {
  const { t } = useTranslation();
  return (
    <div className="odc-multi-column-field__row" data-test={`row ${fieldName}`}>
      <Grid>
        {Children.map(children, (child: ReactElement, i) => {
          let newProps = child.props;
          if (complexFields[i]) {
            newProps = { ...newProps, namePrefix: fieldName };
          } else {
            newProps = { ...newProps, name: `${fieldName}.${child.props.name}` };
          }
          return (
            <GridItem span={spans[i]} key={fieldName}>
              <div className="odc-multi-column-field__col">{cloneElement(child, newProps)}</div>
            </GridItem>
          );
        })}
      </Grid>
      {!isReadOnly && (
        <div className={'odc-multi-column-field__col--button'}>
          <Tooltip content={tooltipDeleteRow || t('console-shared~Remove')}>
            <Button
              icon={<MinusCircleIcon />}
              data-test="delete-row"
              aria-label={tooltipDeleteRow || t('console-shared~Remove')}
              variant={ButtonVariant.plain}
              type={ButtonType.button}
              isInline
              onClick={!disableDeleteRow ? onDelete : undefined}
              isAriaDisabled={disableDeleteRow}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const MultiColumnFieldRow: FC<MultiColumnFieldRowProps> = ({
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
