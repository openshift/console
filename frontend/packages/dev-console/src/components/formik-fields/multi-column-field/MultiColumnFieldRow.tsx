import * as React from 'react';
import { MinusCircleIcon } from '@patternfly/react-icons';
import './MultiColumnField.scss';

export interface MultiColumnFieldRowProps {
  name: string;
  rowIndex: number;
  children: React.ReactNode;
  onDelete: () => void;
}

const MultiColumnFieldRow: React.FC<MultiColumnFieldRowProps> = ({
  name,
  rowIndex,
  onDelete,
  children,
}) => (
  <div className="odc-multi-column-field__row">
    {React.Children.map(children, (child: React.ReactElement) => {
      const fieldName = `${name}.${rowIndex}.${child.props.name}`;
      const newProps = { ...child.props, name: fieldName };
      return (
        <div key={fieldName} className="odc-multi-column-field__col">
          {React.cloneElement(child, newProps)}
        </div>
      );
    })}
    <div className="odc-multi-column-field__col--button">
      <MinusCircleIcon aria-hidden="true" onClick={onDelete} />
      <span className="sr-only">Delete</span>
    </div>
  </div>
);

export default MultiColumnFieldRow;
