import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LevelUpAltIcon } from '@patternfly/react-icons';
import { FormHelperText, Button, ButtonVariant } from '@patternfly/react-core';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => {
  const { t } = useTranslation();
  return (
    <FormHelperText isHidden={false}>
      <Button {...props} type="button" variant={ButtonVariant.link} isInline>
        {t('devconsole~Try Sample')} <LevelUpAltIcon />
      </Button>
    </FormHelperText>
  );
};

export default SampleRepo;
