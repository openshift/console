import * as React from 'react';
import { Grid, GridItem, gridItemSpanValueShape } from '@patternfly/react-core';
import './MultiColumnField.scss';

export interface MultiColumnFieldHeaderProps {
  headers: ({ name: string; required: boolean } | string)[];
  spans: gridItemSpanValueShape[];
}

const MultiColumnFieldHeader: React.FC<MultiColumnFieldHeaderProps> = ({ headers, spans }) => (
  <div className="odc-multi-column-field__row">
    <Grid className="odc-multi-column-field__row">
      {headers.map((header, i) => (
        <GridItem span={spans[i]} key={typeof header === 'string' ? header : header.name}>
          <div className="odc-multi-column-field__col">
            {typeof header === 'string' ? (
              header
            ) : (
              <>
                {header.name}
                {header.required && (
                  <span
                    className="odc-multi-column-field__header--required-label"
                    aria-hidden="true"
                  >
                    *
                  </span>
                )}
              </>
            )}
          </div>
        </GridItem>
      ))}
    </Grid>
    <div className="odc-multi-column-field__col--button" />
  </div>
);

export default MultiColumnFieldHeader;
