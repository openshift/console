import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Progress,
  ProgressMeasureLocation,
  ProgressVariant,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Prompt } from 'react-router';
import { history } from '@console/internal/components/utils';
import { k8sKill, TemplateKind } from '@console/internal/module/k8s';
import {
  ErrorStatus,
  GreenCheckCircleIcon,
  ProgressStatus,
  SuccessStatus,
} from '@console/shared/src';
import { createTemplateFromVM, patchVMDisks } from '../../../k8s/requests/vmtemplate/customize';
import { VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types';

type ItemStatusProps = {
  error: boolean;
  errorMsg: string;
  success: boolean;
  successMsg: string;
  progressMsg: string;
};

const ItemStatus: React.FC<ItemStatusProps> = ({
  error,
  errorMsg,
  success,
  successMsg,
  progressMsg,
}) => (
  <StackItem>
    {error ? (
      <ErrorStatus title={errorMsg} />
    ) : success ? (
      <SuccessStatus title={successMsg} />
    ) : (
      <ProgressStatus title={progressMsg} />
    )}
  </StackItem>
);

type CustomizeSourceFinishProps = {
  vm: VMKind;
};

const CustomizeSourceFinish: React.FC<CustomizeSourceFinishProps> = ({ vm }) => {
  const { t } = useTranslation();

  const [vmtError, setVMTError] = React.useState();
  const [vmt, setVMT] = React.useState<TemplateKind>();
  const [vmError, setVMError] = React.useState<string>();
  const [vmSuccess, setVMSuccess] = React.useState(false);
  const [disksError, setDisksError] = React.useState<string>();
  const [disksSuccess, setDisksSuccess] = React.useState(false);

  const deleteVM = async () => {
    setVMError(undefined);
    try {
      await k8sKill(VirtualMachineModel, vm);
      setVMSuccess(true);
    } catch (err) {
      setVMError(err.message);
    }
  };

  const patchDisksAndDeleteVM = (template: TemplateKind) => {
    setDisksError(undefined);
    setVMError(undefined);
    Promise.all(patchVMDisks(vm, template))
      .then(async () => {
        setDisksSuccess(true);
        deleteVM();
      })
      .catch((err) => setDisksError(err.message));
  };

  const customizeVMT = async () => {
    setVMTError(undefined);
    setDisksError(undefined);
    setVMError(undefined);
    let template: TemplateKind;
    try {
      template = await createTemplateFromVM(vm);
      setVMT(template);
    } catch (err) {
      setVMTError(err.message);
      return;
    }
    patchDisksAndDeleteVM(template);
  };

  React.useEffect(() => {
    customizeVMT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressValue = vmSuccess ? 100 : disksSuccess ? 66 : vmt ? 33 : 0;
  const error = vmtError || disksError || vmError;
  return (
    <>
      <Prompt
        when={progressValue !== 100}
        message={t('kubevirt-plugin~Are you sure you want to leave?')}
      />
      <Bullseye className="kv-customize-source__status">
        <Stack hasGutter>
          <StackItem>
            <Stack hasGutter className="kv-customize-source__status--center">
              <StackItem>
                {progressValue === 100 ? (
                  <GreenCheckCircleIcon size="xl" />
                ) : (
                  <Progress
                    value={progressValue}
                    variant={error ? ProgressVariant.danger : undefined}
                    measureLocation={ProgressMeasureLocation.none}
                  />
                )}
              </StackItem>
              <StackItem>
                <Title headingLevel="h1">
                  {t('kubevirt-plugin~Finishing boot source customization')}
                </Title>
              </StackItem>
              <ItemStatus
                error={vmtError}
                success={!!vmt}
                errorMsg={t('kubevirt-plugin~Error creating virtual machine template')}
                successMsg={t('kubevirt-plugin~Virtual machine template created')}
                progressMsg={t('kubevirt-plugin~Creating virtual machine template')}
              />
              <ItemStatus
                error={!!disksError}
                success={disksSuccess}
                errorMsg={t('kubevirt-plugin~Error patching template disks')}
                successMsg={t('kubevirt-plugin~Template disks patched')}
                progressMsg={t('kubevirt-plugin~Patching template disks')}
              />
              <ItemStatus
                error={!!vmError}
                success={vmSuccess}
                errorMsg={t('kubevirt-plugin~Error deleting temporary VM')}
                successMsg={t('kubevirt-plugin~Temporary VM deleted')}
                progressMsg={t('kubevirt-plugin~Deleting temporary VM')}
              />
            </Stack>
          </StackItem>
          {error && (
            <StackItem>
              <Alert title={t('kubevirt-plugin~Error occured')} variant="danger" isInline>
                {error}
              </Alert>
            </StackItem>
          )}
          <StackItem className="kv-customize-source__status--center">
            {error ? (
              <Button
                onClick={() => {
                  vmtError ? customizeVMT() : disksError ? patchDisksAndDeleteVM(vmt) : deleteVM();
                }}
              >
                {t('kubevirt-plugin~Retry')}
              </Button>
            ) : (
              <Split hasGutter>
                <SplitItem>
                  <Button
                    isDisabled={progressValue !== 100}
                    onClick={() =>
                      history.push(
                        `/k8s/ns/${vmt.metadata.namespace}/vmtemplates/${vmt.metadata.name}`,
                      )
                    }
                  >
                    {t('kubevirt-plugin~Navigate to template details')}
                  </Button>
                </SplitItem>
                <SplitItem>
                  <Button
                    data-test="navigate-list"
                    isDisabled={progressValue !== 100}
                    onClick={() =>
                      history.push(`/k8s/ns/${vmt.metadata.namespace}/virtualization/templates`)
                    }
                    variant="secondary"
                  >
                    {t('kubevirt-plugin~Navigate to template list')}
                  </Button>
                </SplitItem>
              </Split>
            )}
          </StackItem>
        </Stack>
      </Bullseye>
    </>
  );
};

export default CustomizeSourceFinish;
