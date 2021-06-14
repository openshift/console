import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ButtonBar } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';

export const FormFooter: React.FC<FormFooterProps> = ({
  errorMessage,
  inProgress,
  disableNext,
  cancelUrl,
}) => {
  const { t } = useTranslation();

  return (
    <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
      <ActionGroup>
        <Button type="submit" variant="primary" isDisabled={disableNext}>
          {t('lso-plugin~Create')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.push(cancelUrl)}>
          {t('lso-plugin~Cancel')}
        </Button>
      </ActionGroup>
    </ButtonBar>
  );
};

type FormFooterProps = {
  errorMessage: any;
  inProgress: boolean;
  disableNext: boolean;
  cancelUrl: string;
};
