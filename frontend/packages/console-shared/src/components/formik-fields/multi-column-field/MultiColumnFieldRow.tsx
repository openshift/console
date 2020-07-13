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
    {!isReadOnly && (
      <div className={'odc-multi-column-field__col--button'}>
        <Tooltip content={toolTip || 'Remove'}>
          <Button
            aria-label={toolTip || 'Remove'}
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

export default MultiColumnFieldRow;
