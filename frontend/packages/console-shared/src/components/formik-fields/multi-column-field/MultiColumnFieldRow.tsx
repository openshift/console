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

export interface MultiColumnFieldRowProps {
  name: string;
  toolTip?: string;
  rowIndex: number;
  children: React.ReactNode;
  onDelete: () => void;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  spans: gridItemSpanValueShape[];
  complexFields?: boolean[];
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
  complexFields = [],
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={cx('odc-multi-column-field__row', {
        'odc-multi-column-field__row--singleLine': _.isEmpty(complexFields),
      })}
    >
      <Grid>
        {React.Children.map(children, (child: React.ReactElement, i) => {
          const fieldName = `${name}.${rowIndex}`;
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

export default MultiColumnFieldRow;
