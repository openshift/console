import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { healthStateMapping } from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { LSO_NAME, ODF_NAME } from './constants';

type StatusCardStoragePopoverProps = {
  lsoState: any;
  odfState: any;
};

export const StatusCardStoragePopover: React.FC<StatusCardStoragePopoverProps> = ({
  lsoState,
  odfState,
}) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'kubevirt-plugin~OpenShift Data Foundation (recommended for full functionality) or another persistent storage service is required for OpenShift Virtualization',
        )}
      </StackItem>
      <StackItem>
        <StatusPopupSection
          firstColumn={t('kubevirt-plugin~Storage operator')}
          secondColumn={t('kubevirt-plugin~Status')}
        >
          <Status key="lso" value={lsoState.message} icon={healthStateMapping[lsoState.state].icon}>
            {LSO_NAME}
          </Status>
          <Status key="odf" value={odfState.message} icon={healthStateMapping[odfState.state].icon}>
            {ODF_NAME}
          </Status>
        </StatusPopupSection>
      </StackItem>
    </Stack>
  );
};
