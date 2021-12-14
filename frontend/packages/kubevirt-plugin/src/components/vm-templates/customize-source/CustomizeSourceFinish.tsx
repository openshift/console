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
import { TemplateModel } from '@console/internal/models';
import {
  k8sKill,
  k8sPatch,
  PersistentVolumeClaimKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import {
  ErrorStatus,
  GreenCheckCircleIcon,
  ProgressStatus,
  SuccessStatus,
} from '@console/shared/src';
import { VIRTUALMACHINES_TEMPLATES_BASE_URL } from '../../../constants/url-params';
import { PatchBuilder } from '../../../k8s/helpers/patch';
import { createTemplateFromVM, patchVMDisks } from '../../../k8s/requests/vmtemplate/customize';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { getOwnerReferences } from '../../../selectors';
import { VMKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import { buildOwnerReferenceForModel } from '../../../utils';

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
  dataVolumes?: V1alpha1DataVolume[];
  pvcs?: PersistentVolumeClaimKind[];
};

const CustomizeSourceFinish: React.FC<CustomizeSourceFinishProps> = ({ vm, dataVolumes, pvcs }) => {
  const { t } = useTranslation();

  const [vmtError, setVMTError] = React.useState();
  const [vmt, setVMT] = React.useState<TemplateKind>();
  const [vmError, setVMError] = React.useState<string>();
  const [vmSuccess, setVMSuccess] = React.useState(false);
  const [disksError, setDisksError] = React.useState<string>();
  const [disksSuccess, setDisksSuccess] = React.useState(false);

  const deleteVM = async (template?: TemplateKind) => {
    setVMError(undefined);
    try {
      if (vm.spec.dataVolumeTemplates) {
        await k8sPatch(VirtualMachineModel, vm, [
          new PatchBuilder('/spec/dataVolumeTemplates').remove().build(),
        ]);
      }
      if (dataVolumes) {
        const vmOwnedDataVolumes = dataVolumes?.filter(({ metadata }) =>
          metadata?.ownerReferences?.map((ref) => ref.name)?.includes(vm.metadata?.name),
        );

        const vmOwnerRef = buildOwnerReferenceForModel(VirtualMachineModel, vm.metadata?.name);
        const { name, uid } = template?.metadata;
        const templateOwnerRef = buildOwnerReferenceForModel(TemplateModel, name, uid);

        const removeVMOwnerRef = vmOwnedDataVolumes?.map((dv) => {
          return k8sPatch(DataVolumeModel, dv, [
            new PatchBuilder('/metadata/ownerReferences').setListUpdate(templateOwnerRef).build(),
            new PatchBuilder('/metadata/ownerReferences')
              .setListRemove(getOwnerReferences(dv), () =>
                getOwnerReferences(dv)?.includes(vmOwnerRef),
              )
              .build(),
          ]);
        });
        await Promise.all(removeVMOwnerRef);
      }
      await k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vm);
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
        deleteVM(template);
      })
      .catch((err) => setDisksError(err.message));
  };

  const customizeVMT = async () => {
    setVMTError(undefined);
    setDisksError(undefined);
    setVMError(undefined);
    let template: TemplateKind;
    try {
      template = await createTemplateFromVM(vm, pvcs);
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
                errorMsg={t('kubevirt-plugin~Error modifying template disks')}
                successMsg={t('kubevirt-plugin~Template disks modified')}
                progressMsg={t('kubevirt-plugin~Modifying template disks')}
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
                  vmtError
                    ? customizeVMT()
                    : disksError
                    ? patchDisksAndDeleteVM(vmt)
                    : deleteVM(vmt);
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
                        `/k8s/ns/${vmt.metadata.namespace}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}/${vmt.metadata.name}`,
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
                      history.push(
                        `/k8s/ns/${vmt.metadata.namespace}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}`,
                      )
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
