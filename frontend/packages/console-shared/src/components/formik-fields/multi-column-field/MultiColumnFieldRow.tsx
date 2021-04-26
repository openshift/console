import * as React from 'react';
import * as _ from 'lodash';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { MinusCircleIcon } from '@patternfly/react-icons';
import {
  Tooltip,
  Button,
  ButtonVariant,
  ButtonType,
  GridItem,
  Grid,
  gridItemSpanValueShape,
} from '@patternfly/react-core';
import './MultiColumnField.scss';

export interface RowRendererProps {
  fieldName: string;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  spans: gridItemSpanValueShape[];
  complexFields?: boolean[];
  toolTip?: string;
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
  toolTip,
  spans,
  disableDeleteRow,
  onDelete,
}): React.ReactNode => {
  const { t } = useTranslation();
  return (
    <div
      className={cx('odc-multi-column-field__row', {
        'odc-multi-column-field__row--singleLine': _.isEmpty(complexFields),
      })}
    >
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
          <Tooltip content={toolTip || t('console-shared~Remove')}>
            <Button
              aria-label={toolTip || t('console-shared~Remove')}
              variant={ButtonVariant.plain}
              type={ButtonType.button}
              isInline
              onClick={onDelete}
              isDisabled={disableDeleteRow}
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
  toolTip,
  rowIndex,
  onDelete,
  children,
  isReadOnly,
  disableDeleteRow,
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
        toolTip,
        spans,
        disableDeleteRow,
        onDelete,
      })}
    </>
  );
};

export default MultiColumnFieldRow;
