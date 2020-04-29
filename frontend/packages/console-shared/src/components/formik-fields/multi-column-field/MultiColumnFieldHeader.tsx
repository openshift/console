import * as React from 'react';
import { Grid, GridItem, gridItemSpanValueShape } from '@patternfly/react-core';
import './MultiColumnField.scss';

export interface MultiColumnFieldHeaderProps {
  headers: string[];
  spans: gridItemSpanValueShape[];
}

const MultiColumnFieldHeader: React.FC<MultiColumnFieldHeaderProps> = ({ headers, spans }) => (
  <div className="odc-multi-column-field__row">
    <Grid className="odc-multi-column-field__row">
      {headers.map((header, i) => (
        <GridItem span={spans[i]} key={header}>
          <div className="odc-multi-column-field__col">{header}</div>
        </GridItem>
      ))}
    </Grid>
    <div className="odc-multi-column-field__col--button" />
  </div>
);

export default MultiColumnFieldHeader;
