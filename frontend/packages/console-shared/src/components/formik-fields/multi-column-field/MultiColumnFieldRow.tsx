import * as React from 'react';
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

export interface MultiColumnFieldRowProps {
  name: string;
  toolTip?: string;
  rowIndex: number;
  children: React.ReactNode;
  onDelete: () => void;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  spans: gridItemSpanValueShape[];
}

const minusCircleIcon = (onDelete: () => void, disableDeleteRow?: boolean, toolTip?: string) => {
  return (
    <div className={'odc-multi-column-field__col--button'}>
      <Button
        aria-label="Delete"
        variant={ButtonVariant.plain}
        type={ButtonType.button}
        isInline
        onClick={onDelete}
        isDisabled={disableDeleteRow}
      >
        <MinusCircleIcon />
      </Button>
      <span className="sr-only">{toolTip || 'Delete'}</span>
    </div>
  );
};

const renderMinusCircleIcon = (
  onDelete: () => void,
  toolTip?: string,
  disableDeleteRow?: boolean,
) => {
  return toolTip ? (
    <Tooltip content={toolTip}>{minusCircleIcon(onDelete, disableDeleteRow, toolTip)}</Tooltip>
  ) : (
    minusCircleIcon(onDelete, disableDeleteRow)
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
}) => (
  <div className="odc-multi-column-field__row">
    <Grid>
      {React.Children.map(children, (child: React.ReactElement, i) => {
        const fieldName = `${name}.${rowIndex}.${child.props.name}`;
        const newProps = { ...child.props, name: fieldName };
        return (
          <GridItem span={spans[i]} key={fieldName}>
            <div className="odc-multi-column-field__col">{React.cloneElement(child, newProps)}</div>
          </GridItem>
        );
      })}
    </Grid>
    {!isReadOnly && renderMinusCircleIcon(onDelete, toolTip, disableDeleteRow)}
  </div>
);

export default MultiColumnFieldRow;
