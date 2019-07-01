import * as React from 'react';
import { HelpBlock } from 'patternfly-react';
import { LevelUpAltIcon } from '@patternfly/react-icons';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => (
  <HelpBlock>
    <button {...props} type="button" className="btn btn-link btn-link--no-btn-default-values">
      Try Sample <LevelUpAltIcon />
    </button>
  </HelpBlock>
);

export default SampleRepo;
