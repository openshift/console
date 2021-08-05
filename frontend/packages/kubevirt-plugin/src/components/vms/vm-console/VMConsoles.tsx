import * as React from 'react';
import { AccessConsoles } from '@patternfly/react-console';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  AlertActionCloseButton,
  Button,
  ClipboardCopy,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { ConsoleType } from '../../../constants/vm/console-type';
import { VMStatus } from '../../../constants/vm/vm-status';
import { CloudInitDataHelper } from '../../../k8s/wrapper/vm/cloud-init-data-helper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { isWindows } from '../../../selectors/vm/combined';
import {
  getCloudInitVolume,
  getIsGraphicsConsoleAttached,
  getIsSerialConsoleAttached,
} from '../../../selectors/vm/selectors';
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

const getAvailableType = (showVNCOption, showSerialOption) => {
  if (showVNCOption) {
    return ConsoleType.VNC;
  }

  return showSerialOption ? ConsoleType.SERIAL : null;
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
  const [showCredentials, setShowCredentials] = React.useState<boolean>(false);
  const showVNCOption = getIsGraphicsConsoleAttached(vm) !== false && renderVNCConsole;
  const showSerialOption = getIsSerialConsoleAttached(vm) !== false;
  const [consoleType, setConsoleType] = React.useState(
    type || getAvailableType(showVNCOption, showSerialOption),
  );

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

  // const consoleType = typeNotSupported || type == null ? getAvailableType() : type;

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
            {t('kubevirt-plugin~Open Console in New Window')}
          </Button>
        </StackItem>
      )}
      {cloudInitPassword && (
        <StackItem>
          <Accordion>
            <AccordionItem>
              <AccordionToggle
                id="cloudinit-credentials"
                onClick={() => setShowCredentials(!showCredentials)}
                isExpanded={showCredentials}
              >
                {t('kubevirt-plugin~Guest login credentials')}
              </AccordionToggle>
              <AccordionContent isHidden={!showCredentials}>
                <Trans ns="kubevirt-plugin">
                  The following credentials for this operating system were created via{' '}
                  <strong>cloud-init</strong>. If unsuccessful, cloud-init could be improperly
                  configured. Please contact the image provider for more information.
                </Trans>
                <p>
                  <strong>{t('kubevirt-plugin~User name:')} </strong>{' '}
                  {cloudInitUsername || CLOUD_INIT_MISSING_USERNAME}
                  {'  '}
                  <strong>{t('kubevirt-plugin~Password:')} </strong>{' '}
                  <ClipboardCopy variant="inline-compact" isCode>
                    {cloudInitPassword}
                  </ClipboardCopy>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </StackItem>
      )}
      {typeNotSupported && showAlert && (
        <StackItem>
          <Alert
            isInline
            variant="danger"
            actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
            title={t(
              'kubevirt-plugin~Selected type {{typeName}} is unsupported. Falling back to a supported type',
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
            title={t('kubevirt-plugin~Console is open in another tab/window')}
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
          {showSerialOption && <SerialConsoleConnector vmi={vmi} setConsoleType={setConsoleType} />}
          {showVNCOption && <VncConsoleConnector vmi={vmi} setConsoleType={setConsoleType} />}
          {isWindows(vm) && (
            <DesktopViewerSelector
              vmPod={vmStatusBundle.pod}
              vm={vm}
              vmi={vmi}
              setConsoleType={setConsoleType}
            />
          )}
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
