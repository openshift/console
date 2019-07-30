import * as React from 'react';
import { LevelUpAltIcon } from '@patternfly/react-icons';
import { FormHelperText, Button, ButtonVariant } from '@patternfly/react-core';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => (
  <FormHelperText isHidden={false}>
    <Button {...props} type="button" variant={ButtonVariant.link} isInline>
      Try Sample <LevelUpAltIcon />
    </Button>
  </FormHelperText>
);

export default SampleRepo;
