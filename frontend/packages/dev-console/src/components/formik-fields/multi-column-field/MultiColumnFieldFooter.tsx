import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from 'patternfly-react';

export interface MultiColumnFieldHeader {
  addLabel: string;
  onAdd: () => void;
}

const MultiColumnFieldFooter: React.FC<MultiColumnFieldHeader> = ({ addLabel, onAdd }) => (
  <Button type="button" bsStyle="link" className="btn-link--no-btn-default-values" onClick={onAdd}>
    <PlusCircleIcon style={{ marginRight: 'var(--pf-global--spacer--xs)' }} />
    {addLabel || 'Add values'}
  </Button>
);

export default MultiColumnFieldFooter;
