import * as React from 'react';
import { FormHelperText, Button, ButtonVariant } from '@patternfly/react-core';
import { LevelUpAltIcon } from '@patternfly/react-icons/dist/esm/icons/level-up-alt-icon';
import { useTranslation } from 'react-i18next';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => {
  const { t } = useTranslation();
  return (
    <FormHelperText>
      <Button {...props} type="button" variant={ButtonVariant.link} isInline>
        {t('devconsole~Try sample')} <LevelUpAltIcon />
      </Button>
    </FormHelperText>
  );
};

export default SampleRepo;
