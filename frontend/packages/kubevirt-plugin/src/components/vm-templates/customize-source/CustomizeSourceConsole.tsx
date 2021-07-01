import * as React from 'react';
import {
  Button,
  Divider,
  Popover,
  PopoverProps,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Prompt } from 'react-router';
import { ResourceLink } from '@console/internal/components/utils';
import { TEMPLATE_CUSTOMIZED_ANNOTATION } from '../../../constants';
import { useRenderVNCConsole } from '../../../hooks/use-render-vnc-console';
import { VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { VMStatusBundle } from '../../../statuses/vm/types';
import { VMIKind, VMKind } from '../../../types';
import cancelCustomizationModal from '../../modals/template-customization/CancelCustomizationModal';
import finishCustomizationModal from '../../modals/template-customization/FinishCustomizationModal';
import VMConsoles from '../../vms/vm-console/VMConsoles';

import './customize-source.scss';

type VMPopoverProps = Pick<CustomizeSourceConsoleProps, 'vm'> & Pick<PopoverProps, 'children'>;

const VMPopover: React.FC<VMPopoverProps> = ({ vm, children }) => {
  const { t } = useTranslation();
  return (
    <Popover
      headerContent={<div>{t('kubevirt-plugin~Source running on virtual machine')}</div>}
      bodyContent={
        <Stack hasGutter>
          <StackItem>
            {t(
              'kubevirt-plugin~This boot source customization is running on the following virtual machine:',
            )}
          </StackItem>
          <StackItem>
            <ResourceLink
              kind={kubevirtReferenceForModel(VirtualMachineModel)}
              name={vm.metadata.name}
              namespace={vm.metadata.namespace}
            />
          </StackItem>
          <StackItem>
            {t('kubevirt-plugin~This virtual machine will be deleted when customization is done.')}
          </StackItem>
        </Stack>
      }
    >
      {children}
    </Popover>
  );
};

const CustomizeSourceConsole: React.FC<CustomizeSourceConsoleProps> = ({
  vm,
  vmi,
  vmStatusBundle,
  setFinish,
}) => {
  const renderVNCConsole = useRenderVNCConsole({
    vmName: vm.metadata.name,
    shouldBeFullScreen: false,
  });
  const { t } = useTranslation();
  const template = JSON.parse(vm.metadata.annotations[TEMPLATE_CUSTOMIZED_ANNOTATION]);
  const [disablePrompt, setDisablePrompt] = React.useState(false);
  return (
    <>
      <Prompt
        when={!disablePrompt}
        message={t('kubevirt-plugin~Are you sure you want to leave?')}
      />
      <Stack hasGutter>
        <StackItem>
          <Stack className="kv-customize-source" hasGutter>
            <StackItem>
              <Title headingLevel="h1">{t('kubevirt-plugin~Customize boot source')}</Title>
            </StackItem>
            <StackItem>
              {t(
                'kubevirt-plugin~Customize this boot source clone for "{{templateName}}" template.',
                {
                  templateName: template.metadata.name,
                },
              )}
              <br />
              <Trans t={t} ns="kubevirt-plugin">
                This boot source will be customized on a temporary{' '}
                <VMPopover vm={vm}>
                  <Button variant="link" isInline>
                    running virtual machine
                  </Button>
                </VMPopover>
                .
              </Trans>
            </StackItem>
          </Stack>
        </StackItem>
        <Divider component="div" />
        <StackItem className="kv-customize-source">
          <div className="kv-customize-source__form-body">
            <VMConsoles
              vm={vm}
              vmStatusBundle={vmStatusBundle}
              vmi={vmi}
              showOpenInNewWindow={false}
              renderVNCConsole={renderVNCConsole}
            />
          </div>
          <Split hasGutter className="kv-customize-source__footer">
            <SplitItem>
              <Button
                data-test="finish-customization"
                onClick={() => {
                  finishCustomizationModal({
                    setFinish,
                    vmTemplate: template,
                  });
                }}
              >
                {t('kubevirt-plugin~Make this boot source available')}
              </Button>
            </SplitItem>
            <SplitItem>
              <Button
                variant="link"
                onClick={() => {
                  setDisablePrompt(true);
                  cancelCustomizationModal({
                    vm,
                    backToVirt: true,
                    close: () => setDisablePrompt(false),
                  });
                }}
              >
                {t('kubevirt-plugin~Cancel')}
              </Button>
            </SplitItem>
          </Split>
        </StackItem>
      </Stack>
    </>
  );
};

type CustomizeSourceConsoleProps = {
  vmStatusBundle: VMStatusBundle;
  vm: VMKind;
  vmi: VMIKind;
  setFinish: React.Dispatch<boolean>;
};

export default CustomizeSourceConsole;
