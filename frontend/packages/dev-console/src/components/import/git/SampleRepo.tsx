import { FormHelperText, Button, ButtonVariant } from '@patternfly/react-core';
import { LevelUpAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export interface SampleRepoProps {
  onClick: () => void;
}

const SampleRepo = (props) => {
  const { t } = useTranslation();
  return (
    <FormHelperText>
      <Button
        icon={<LevelUpAltIcon />}
        {...props}
        type="button"
        variant={ButtonVariant.link}
        isInline
      >
        {t('devconsole~Try sample')}
      </Button>
    </FormHelperText>
  );
};

export default SampleRepo;
