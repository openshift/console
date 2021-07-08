import * as React from 'react';
import { AccessConsoles } from '@patternfly/react-console';
import { Alert, AlertActionCloseButton, Button, Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { ConsoleType } from '../../../constants/vm/console-type';
import { VMStatus } from '../../../constants/vm/vm-status';
import { CloudInitDataHelper } from '../../../k8s/wrapper/vm/cloud-init-data-helper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import {
  getCloudInitVolume,
  getIsGraphicsConsoleAttached,
  getIsSerialConsoleAttached,
  isWindows,
} from '../../../selectors/vm';
import { isVMIPaused, isVMIRunning } from '../../../selectors/vmi';
import { VMStatusBundle } from '../../../statuses/vm/types';
import { VMIKind, VMKind } from '../../../types/vm';
import { CLOUD_INIT_MISSING_USERNAME } from '../../../utils/strings';
import SerialConsoleConnector from './connectors/SerialConsoleConnector';
import VncConsoleConnector from './connectors/VncConsoleConnector';
import DesktopViewerSelector from './DesktopViewerSelector';

const VMIsDown: React.FC = () => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      This Virtual Machine is down. Please start it to access its console.
    </div>
  </div>
);

const VMIsStarting: React.FC = () => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      <LoadingInline />
      This Virtual Machine is starting up. The console will be available soon.
    </div>
  </div>
);

const VMNotReady: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <div className="kubevirt-vm-consoles__loading">
        {t('kubevirt-plugin~This Virtual Machine is migrating and cannot be started at the moment')}
      </div>
    </div>
  );
};

const VMConsoles: React.FC<VMConsolesProps> = ({
  vm,
  vmi,
  vmStatusBundle,
  type,
  showOpenInNewWindow = true,
  renderVNCConsole,
}) => {
  const { t } = useTranslation();
  const [showAlert, setShowAlert] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const showVNCOption = getIsGraphicsConsoleAttached(vm) !== false && renderVNCConsole;
  const showSerialOption = getIsSerialConsoleAttached(vm) !== false;
  const cloudInitVolume = getCloudInitVolume(vm);
  const data = new VolumeWrapper(cloudInitVolume).getCloudInitNoCloud();
  const cloudInitHelper = new CloudInitDataHelper(data);
  const cloudInitUsername = cloudInitHelper.get('user');
  const cloudInitPassword = cloudInitHelper.get('password');

  if (!isVMIRunning(vmi)) {
    if (vmStatusBundle?.status?.isMigrating()) {
      return <VMNotReady />;
    }

    return vmStatusBundle?.status === VMStatus.STARTING ||
      vmStatusBundle?.status === VMStatus.VMI_WAITING ||
      (vmStatusBundle?.status?.isImporting() && vm.spec.running) ? (
      <VMIsStarting />
    ) : (
      <VMIsDown />
    );
  }

  const vmName = vm?.metadata?.name || vmi?.metadata?.name;
  const namespace = vm?.metadata?.namespace || vmi?.metadata?.namespace;
  const typeNotSupported =
    (!showVNCOption && type === ConsoleType.VNC) ||
    (!showSerialOption && type === ConsoleType.SERIAL);

  const getAvailableType = () => {
    if (showVNCOption) {
      return ConsoleType.VNC;
    }
    if (showSerialOption) {
      return ConsoleType.SERIAL;
    }
    return null;
  };

  const consoleType = typeNotSupported || type == null ? getAvailableType() : type;

  const isPaused = isVMIPaused(((vm as any) as VMIKind) || vmi);

  return (
    <Stack hasGutter>
      {showOpenInNewWindow && consoleType && (
        <StackItem>
          <Button
            variant="secondary"
            onClick={() =>
              window.open(
                `/k8s/ns/${namespace}/virtualmachineinstances/${vmName}/standaloneconsole?type=${consoleType.toString()}`,
                `${vmName}-console`,
                'modal=yes,alwaysRaised=yes,width=1024,height=768',
              )
            }
          >
            {t('kubevirt-plugin~Open Console in new Window')}
          </Button>
        </StackItem>
      )}
      {cloudInitPassword && (
        <StackItem>
          <Alert variant="info" isInline title={t('kubevirt-plugin~Guest login credentials')}>
            <Trans ns="kubevirt-plugin">
              The following credentials for this operating system were created via{' '}
              <strong>Cloud-init</strong>. If unsuccessful cloud-init could be improperly
              configured. Please contact the image provider for more information.
            </Trans>
            <p>
              <strong>{t('kubevirt-plugin~User name:')} </strong>{' '}
              {cloudInitUsername || CLOUD_INIT_MISSING_USERNAME}
              {'  '}
              <strong>{t('kubevirt-plugin~Password:')} </strong>{' '}
              {showPassword ? (
                <>
                  {cloudInitPassword}{' '}
                  <Button isSmall isInline variant="link" onClick={() => setShowPassword(false)}>
                    {t('kubevirt-plugin~Hide password')}
                  </Button>
                </>
              ) : (
                <Button isSmall isInline variant="link" onClick={() => setShowPassword(true)}>
                  {t('kubevirt-plugin~Show password')}
                </Button>
              )}
            </p>
          </Alert>
        </StackItem>
      )}
      {typeNotSupported && showAlert && (
        <StackItem>
          <Alert
            isInline
            variant="danger"
            actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
            title={t(
              'kubevirt-plugin~Selected type {{typeName}} is unsupported, falling back to a supported type',
              { typeName: type.toPatternflyLabel() },
            )}
          />
        </StackItem>
      )}
      {!renderVNCConsole && (
        <StackItem>
          <Alert
            isInline
            variant="danger"
            title={t('kubevirt-plugin~Console is open on another tab/window')}
          />
        </StackItem>
      )}
      {isPaused && (
        <StackItem>
          <Alert
            isInline
            variant="warning"
            title={t(
              'kubevirt-plugin~Virtual machine is paused. Console will be active after unpause',
            )}
          />
        </StackItem>
      )}
      <StackItem>
        <AccessConsoles preselectedType={consoleType?.toPatternflyLabel()}>
          {showSerialOption && <SerialConsoleConnector vmi={vmi} />}
          {showVNCOption && <VncConsoleConnector vmi={vmi} />}
          {isWindows(vm) && <DesktopViewerSelector vmPod={vmStatusBundle.pod} vm={vm} vmi={vmi} />}
        </AccessConsoles>
      </StackItem>
    </Stack>
  );
};

type VMConsolesProps = {
  vm: VMKind;
  vmi?: VMIKind;
  vmStatusBundle: VMStatusBundle;
  type?: ConsoleType;
  showOpenInNewWindow?: boolean;
  renderVNCConsole?: boolean;
};

export default VMConsoles;
