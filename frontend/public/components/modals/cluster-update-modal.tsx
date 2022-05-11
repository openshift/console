import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Radio, Select, SelectOption } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ExternalLink, isUpstream, openshiftHelpBase } from '@console/internal/components/utils';

import { ClusterVersionModel, MachineConfigPoolModel, NodeModel } from '../../models';
import { FieldLevelHelp, HandlePromiseProps, withHandlePromise } from '../utils';
import {
  ClusterVersionKind,
  getAvailableClusterUpdates,
  getConditionUpgradeableFalse,
  getDesiredClusterVersion,
  getMCPsToPausePromises,
  getSortedUpdates,
  isMCPMaster,
  isMCPPaused,
  isMinorVersionNewer,
  k8sPatch,
  MachineConfigPoolKind,
  NodeTypeNames,
  referenceForModel,
  sortMCPsByCreationTimestamp,
} from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';
import { ClusterNotUpgradeableAlert } from '../cluster-settings/cluster-settings';
import { MachineConfigPoolsSelector } from '../machine-config-pools-selector';

enum upgradeTypes {
  Full = 'Full',
  Partial = 'Partial',
}

const ClusterUpdateModal = withHandlePromise((props: ClusterUpdateModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const availableSortedUpdates = getSortedUpdates(cv);
  const currentVersion = getDesiredClusterVersion(cv);
  const currentMinorVersionPatchUpdate = availableSortedUpdates?.find(
    (update) => !isMinorVersionNewer(currentVersion, update.version),
  );
  const [desiredVersion, setDesiredVersion] = React.useState(
    (clusterUpgradeableFalse
      ? currentMinorVersionPatchUpdate?.version
      : availableSortedUpdates[0]?.version) || '',
  );
  const [machineConfigPools, machineConfigPoolsLoaded] = useK8sWatchResource<
    MachineConfigPoolKind[]
  >({
    isList: true,
    kind: referenceForModel(MachineConfigPoolModel),
  });
  const [error, setError] = React.useState(errorMessage);
  const [isOpen, setIsOpen] = React.useState(false);
  const [machineConfigPoolsToPause, setMachineConfigPoolsToPause] = React.useState<string[]>([]);
  const [upgradeType, setUpgradeType] = React.useState<upgradeTypes>(upgradeTypes.Full);
  React.useEffect(() => {
    const initialMCPPausedValues = machineConfigPools
      .filter((mcp) => !isMCPMaster(mcp) && isMCPPaused(mcp))
      .map((mcp) => mcp.metadata.name);
    setMachineConfigPoolsToPause(initialMCPPausedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run the effect once so changes don't affect user input
  const onToggleVersion = () => setIsOpen(!isOpen);
  const onSelectVersion = (event, selection) => {
    event.preventDefault();
    setDesiredVersion(selection);
    setIsOpen(!isOpen);
  };
  const handleUpgradeTypeChange = (value: typeof upgradeType) => {
    setUpgradeType(value);
  };
  const handleMCPSelectionChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>) => {
    const checkedItems = [...machineConfigPoolsToPause];
    checked
      ? checkedItems.push(event.currentTarget.id)
      : _.pull(checkedItems, event.currentTarget.id);
    setMachineConfigPoolsToPause(checkedItems);
  };
  const pauseableMCPs = machineConfigPools
    .filter((mcp) => !isMCPMaster(mcp))
    .sort(sortMCPsByCreationTimestamp);
  const pausedMCPs = pauseableMCPs.filter((mcp) => isMCPPaused(mcp));
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const available = getAvailableClusterUpdates(cv);
    const desired = _.find(available, { version: desiredVersion });
    if (!desired) {
      setError(
        `Version ${desiredVersion} not found among the available updates. Select another version.`,
      );
      return;
    }

    // Clear any previous error message.
    setError('');
    let MCPsToResumePromises;
    let MCPsToPausePromises;
    if (upgradeType === upgradeTypes.Full) {
      MCPsToResumePromises = getMCPsToPausePromises(pausedMCPs, false);
      MCPsToPausePromises = [];
    } else {
      const MCPsToResume = pausedMCPs.filter((mcp) =>
        machineConfigPoolsToPause.find((m) => m !== mcp.metadata.name),
      );
      const MCPsToPause = pauseableMCPs.filter((mcp) =>
        machineConfigPoolsToPause.find((m) => m === mcp.metadata.name),
      );
      MCPsToResumePromises = getMCPsToPausePromises(MCPsToResume, false);
      MCPsToPausePromises = getMCPsToPausePromises(MCPsToPause, true);
    }
    const patch = [{ op: 'add', path: '/spec/desiredUpdate', value: desired }];
    return handlePromise(
      Promise.all([
        k8sPatch(ClusterVersionModel, cv, patch),
        ...MCPsToResumePromises,
        ...MCPsToPausePromises,
      ]),
      close,
    );
  };
  const options = availableSortedUpdates.map(({ version }) => {
    return (
      <SelectOption
        key={version}
        value={version}
        isDisabled={clusterUpgradeableFalse && isMinorVersionNewer(currentVersion, version)}
      />
    );
  });
  const helpLink = isUpstream()
    ? `${openshiftHelpBase}updating/update-using-custom-machine-config-pools.html`
    : `${openshiftHelpBase}html/updating_clusters/update-using-custom-machine-config-pools.html`;
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('public~Update cluster')}</ModalTitle>
      <ModalBody>
        {clusterUpgradeableFalse && <ClusterNotUpgradeableAlert cv={cv} />}
        <div className="form-group">
          <label>{t('public~Current version')}</label>
          <p>{currentVersion}</p>
        </div>
        <div className="form-group">
          <label id="version-label">{t('public~Select new version')}</label>
          <Select
            aria-labelledby="version-label"
            onToggle={onToggleVersion}
            onSelect={onSelectVersion}
            selections={desiredVersion}
            isOpen={isOpen}
            isDisabled={clusterUpgradeableFalse && !currentMinorVersionPatchUpdate}
          >
            {options}
          </Select>
        </div>
        <div className="form-group">
          <label>
            {t('public~Update options')}
            <FieldLevelHelp>
              {t(
                "public~Full cluster update allows you to update all your nodes, but takes longer. Partial cluster update allows you to pause worker and custom pool Nodes to accommodate your maintenance schedule, but you'll need to resume the non-master node update within 60 days to avoid failure.",
              )}
            </FieldLevelHelp>
          </label>
          <Radio
            isChecked={upgradeType === upgradeTypes.Full}
            name={upgradeTypes.Full}
            onChange={() => handleUpgradeTypeChange(upgradeTypes.Full)}
            label={t('public~Full cluster update')}
            id={upgradeTypes.Full}
            value={upgradeTypes.Full}
            description={t(
              'public~{{master}}, {{worker}}, and custom pool {{resource}} are updated concurrently. This might take longer, so make sure to allocate enough time for maintenance.',
              {
                master: NodeTypeNames.Master,
                worker: NodeTypeNames.Worker,
                resource: NodeModel.labelPlural,
              },
            )}
            className="pf-u-mb-sm"
            body={
              machineConfigPoolsLoaded &&
              pausedMCPs.length > 0 &&
              upgradeType === upgradeTypes.Full && (
                <Alert
                  variant="warning"
                  isInline
                  isPlain
                  title={t(
                    'public~Paused {{worker}} or custom pool {{resource}} updates will be resumed. If you want to update only the control plane, select "Partial cluster update" below.',
                    { worker: NodeTypeNames.Worker, resource: NodeModel.label },
                  )}
                />
              )
            }
          />
          <Radio
            isChecked={upgradeType === upgradeTypes.Partial}
            name={upgradeTypes.Partial}
            onChange={() => handleUpgradeTypeChange(upgradeTypes.Partial)}
            label={t('public~Partial cluster update')}
            id={upgradeTypes.Partial}
            value={upgradeTypes.Partial}
            description={t(
              'public~Pause {{worker}} or custom pool {{resource}} updates to accommodate your maintenance schedule.',
              { worker: NodeTypeNames.Worker, resource: NodeModel.label },
            )}
            className="pf-u-mb-md"
            body={
              upgradeType === upgradeTypes.Partial && (
                <>
                  <MachineConfigPoolsSelector
                    machineConfigPools={pauseableMCPs}
                    selected={machineConfigPoolsToPause}
                    onChange={handleMCPSelectionChange}
                  />
                  <Alert
                    variant="warning"
                    isInline
                    isPlain
                    title={t('public~You must resume updates within 60 days to avoid failures.')}
                    className="pf-u-mb-md"
                  >
                    <ExternalLink href={helpLink}>{t('public~Learn more')}</ExternalLink>
                  </Alert>
                </>
              )
            }
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={error}
        inProgress={inProgress}
        submitText={t('public~Update')}
        cancelText={t('public~Cancel')}
        cancel={cancel}
        submitDisabled={
          !desiredVersion ||
          (upgradeType === upgradeTypes.Partial && machineConfigPoolsToPause.length === 0)
        }
      />
    </form>
  );
});

export const clusterUpdateModal = createModalLauncher(ClusterUpdateModal);

type ClusterUpdateModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps &
  HandlePromiseProps;
