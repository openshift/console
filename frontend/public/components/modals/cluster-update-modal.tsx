import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Radio, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  documentationURLs,
  ExternalLink,
  getDocumentationURL,
} from '@console/internal/components/utils';
import { DropdownWithSwitch } from '@console/shared/src/components/dropdown';

import { ClusterVersionModel, MachineConfigPoolModel, NodeModel } from '../../models';
import {
  FieldLevelHelp,
  HandlePromiseProps,
  LinkifyExternal,
  isManaged,
  withHandlePromise,
} from '../utils';
import {
  ClusterVersionKind,
  getConditionUpgradeableFalse,
  getDesiredClusterVersion,
  getMCPsToPausePromises,
  getNotRecommendedUpdateCondition,
  getSortedAvailableUpdates,
  getSortedNotRecommendedUpdates,
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
import {
  ClusterNotUpgradeableAlert,
  UpdateBlockedLabel,
} from '../cluster-settings/cluster-settings';
import { MachineConfigPoolsSelector } from '../machine-config-pools-selector';

enum upgradeTypes {
  Full = 'Full',
  Partial = 'Partial',
}

const ClusterUpdateModal = withHandlePromise((props: ClusterUpdateModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const availableSortedUpdates = getSortedAvailableUpdates(cv);
  const notRecommendedSortedUpdates = getSortedNotRecommendedUpdates(cv);
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
  const [error, setError] = React.useState('');
  const [machineConfigPoolsToPause, setMachineConfigPoolsToPause] = React.useState<string[]>([]);
  const [upgradeType, setUpgradeType] = React.useState<upgradeTypes>(upgradeTypes.Full);
  const [includeNotRecommended, setIncludeNotRecommended] = React.useState(false);
  const { t } = useTranslation();
  React.useEffect(() => {
    const initialMCPPausedValues = machineConfigPools
      .filter((mcp) => !isMCPMaster(mcp) && isMCPPaused(mcp))
      .map((mcp) => mcp.metadata.name);
    setMachineConfigPoolsToPause(initialMCPPausedValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run the effect once so changes don't affect user input
  const onSelectVersion = (event, selection) => {
    event.preventDefault();
    setDesiredVersion(selection);
  };
  const handleUpgradeTypeChange = (value: typeof upgradeType) => {
    setUpgradeType(value);
  };
  const handleMCPSelectionChange = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
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
  const desiredRecommendedUpdate = _.find(availableSortedUpdates, { version: desiredVersion });
  const desiredNotRecommendedUpdate = _.find(notRecommendedSortedUpdates, {
    release: { version: desiredVersion },
  });
  const desiredNotRecommendedUpdateConditions = getNotRecommendedUpdateCondition(
    desiredNotRecommendedUpdate?.conditions,
  );
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!desiredRecommendedUpdate && !desiredNotRecommendedUpdate) {
      setError(
        t(
          'public~Version {{desiredVersion}} not found among the supported updates. Select another version.',
          { desiredVersion },
        ),
      );
      return;
    }

    // Clear any previous error message.
    setError('');
    let MCPsToPausePromises;
    let MCPsToResumePromises;
    if (upgradeType === upgradeTypes.Full) {
      MCPsToPausePromises = [];
      MCPsToResumePromises = getMCPsToPausePromises(pausedMCPs, false);
    } else {
      const MCPsToPause = pauseableMCPs.filter((mcp) =>
        machineConfigPoolsToPause.find((m) => m === mcp.metadata.name),
      );
      const MCPsToResume = pauseableMCPs.filter((mcp) => !MCPsToPause.includes(mcp));
      MCPsToPausePromises = getMCPsToPausePromises(MCPsToPause, true);
      MCPsToResumePromises = getMCPsToPausePromises(MCPsToResume, false);
    }
    const patch = [
      {
        op: 'add',
        path: '/spec/desiredUpdate',
        value: desiredNotRecommendedUpdate
          ? desiredNotRecommendedUpdate.release
          : desiredRecommendedUpdate,
      },
    ];
    return handlePromise(
      Promise.all([
        k8sPatch(ClusterVersionModel, cv, patch),
        ...MCPsToResumePromises,
        ...MCPsToPausePromises,
      ]),
      close,
    );
  };
  const dropdownItem = (version) => {
    const isDisabled = clusterUpgradeableFalse && isMinorVersionNewer(currentVersion, version);
    return {
      isDisabled,
      key: version,
      title: isDisabled ? (
        <>
          {version} <UpdateBlockedLabel />
        </>
      ) : (
        version
      ),
    };
  };
  const recommendedOptions = availableSortedUpdates.map(({ version }) => {
    return dropdownItem(version);
  });
  const notRecommendedOptions = notRecommendedSortedUpdates.map(({ release: { version } }) => {
    return dropdownItem(version);
  });
  const options = [
    {
      items: recommendedOptions,
      key: 'recommended',
      label: t('public~Recommended'),
    },
  ];
  if (includeNotRecommended) {
    options.unshift({
      items: notRecommendedOptions,
      key: 'notRecommended',
      label: t('public~Have known issues'),
    });
  }
  const helpURL = getDocumentationURL(documentationURLs.updateUsingCustomMachineConfigPools);

  return (
    <form onSubmit={submit} name="form" className="modal-content" data-test="update-cluster-modal">
      <ModalTitle>{t('public~Update cluster')}</ModalTitle>
      <ModalBody>
        {clusterUpgradeableFalse && <ClusterNotUpgradeableAlert onCancel={cancel} cv={cv} />}
        <div className="form-group">
          <label>{t('public~Current version')}</label>
          <p>{currentVersion}</p>
        </div>
        <div className="form-group">
          <label id="version-label">{t('public~Select new version')}</label>
          <DropdownWithSwitch
            isFullWidth
            onSelect={onSelectVersion}
            options={options}
            selected={desiredVersion}
            switchIsChecked={includeNotRecommended}
            switchIsDisabled={notRecommendedOptions.length === 0}
            switchLabel={
              <>
                {t('public~Include versions with known issues')}
                <FieldLevelHelp>
                  {t(
                    'public~These versions are supported, but include known issues. Review the known issues before updating.',
                  )}
                </FieldLevelHelp>
              </>
            }
            switchLabelClassName="co-switch-label"
            switchLabelIsReversed
            switchOnChange={(val) => setIncludeNotRecommended(val)}
            toggleLabel={desiredVersion}
          />
          {desiredNotRecommendedUpdate && desiredNotRecommendedUpdateConditions?.message && (
            <Alert
              className="pf-v5-u-mt-sm"
              isInline
              title={t(
                'public~Updating this cluster to {{desiredVersion}} is supported, but includes known issues.  Review the known issues before updating.',
                { desiredVersion: desiredNotRecommendedUpdate.release.version },
              )}
              variant="info"
              data-test="update-cluster-modal-not-recommended-alert"
            >
              <TextContent>
                <Text component={TextVariants.p}>
                  <LinkifyExternal>
                    {desiredNotRecommendedUpdateConditions.message.split('\n').map((item) => (
                      <React.Fragment key={item}>
                        {item}
                        <br />
                      </React.Fragment>
                    ))}
                  </LinkifyExternal>
                </Text>
              </TextContent>
            </Alert>
          )}
        </div>
        <div className="form-group">
          <label>
            {t('public~Update options')}
            <FieldLevelHelp>
              {t(
                "public~Full cluster update allows you to update all your Nodes, but takes longer. Control plane only update allows you to pause worker and custom pool Nodes to accommodate your maintenance schedule, but you'll need to resume the non-control plane Node updates within 60 days to avoid failure.",
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
            className="pf-v5-u-mb-sm"
            body={
              machineConfigPoolsLoaded &&
              pausedMCPs.length > 0 &&
              upgradeType === upgradeTypes.Full && (
                <Alert
                  variant="warning"
                  isInline
                  isPlain
                  title={t(
                    'public~Paused {{worker}} or custom pool {{resource}} updates will be resumed. If you want to update only the control plane, select "Control plane only update" below.',
                    { worker: NodeTypeNames.Worker, resource: NodeModel.label },
                  )}
                  data-test="update-cluster-modal-paused-nodes-warning"
                />
              )
            }
            data-test="update-cluster-modal-full-update-radio"
          />
          <Radio
            isChecked={upgradeType === upgradeTypes.Partial}
            name={upgradeTypes.Partial}
            onChange={() => handleUpgradeTypeChange(upgradeTypes.Partial)}
            label={t('public~Control plane only update')}
            id={upgradeTypes.Partial}
            value={upgradeTypes.Partial}
            description={t(
              'public~Pause {{worker}} or custom pool {{resource}} updates to accommodate your maintenance schedule.',
              { worker: NodeTypeNames.Worker, resource: NodeModel.label },
            )}
            className="pf-v5-u-mb-md"
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
                    className="pf-v5-u-mb-md"
                  >
                    {!isManaged() && (
                      <ExternalLink href={helpURL}>{t('public~Learn more')}</ExternalLink>
                    )}
                  </Alert>
                </>
              )
            }
            data-test="update-cluster-modal-partial-update-radio"
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage || error}
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
