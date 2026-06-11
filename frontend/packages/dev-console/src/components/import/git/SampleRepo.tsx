import { FormHelperText, Button, ButtonVariant } from '@patternfly/react-core';
import { RhUiLabIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const SampleRepo = (props) => {
  const { t } = useTranslation();
  return (
    <FormHelperText>
      <Button icon={<RhUiLabIcon />} {...props} type="button" variant={ButtonVariant.link} isInline>
        {t('devconsole~Try sample')}
      </Button>
    </FormHelperText>
  );
};

export default SampleRepo;
