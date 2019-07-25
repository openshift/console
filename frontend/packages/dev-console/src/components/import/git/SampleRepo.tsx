import * as React from 'react';
import { LevelUpAltIcon } from '@patternfly/react-icons';
import { FormHelperText } from '@patternfly/react-core';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => (
  <FormHelperText isHidden={false}>
    <button {...props} type="button" className="btn btn-link btn-link--no-btn-default-values">
      Try Sample <LevelUpAltIcon />
    </button>
  </FormHelperText>
);

export default SampleRepo;
