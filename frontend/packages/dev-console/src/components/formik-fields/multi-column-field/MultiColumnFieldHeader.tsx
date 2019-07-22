import * as React from 'react';
import './MultiColumnField.scss';

export interface MultiColumnFieldHeaderProps {
  headers: string[];
}

const MultiColumnFieldHeader: React.FC<MultiColumnFieldHeaderProps> = ({ headers }) => (
  <div className="odc-multi-column-field__row">
    {headers.map((header) => (
      <div className="odc-multi-column-field__col" key={header}>
        {header}
      </div>
    ))}
    <div className="odc-multi-column-field__col--button" />
  </div>
);

export default MultiColumnFieldHeader;
