import type { FC, Ref, MouseEvent, ChangeEvent } from 'react';
import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { alphanumericCompare } from '@console/shared';
import { PackageManifestKind } from '../../types';
import { DeprecatedOperatorWarningIcon } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { useDeprecatedOperatorWarnings } from '../deprecated-operator-warnings/use-deprecated-operator-warnings';

export const OperatorChannelSelect: FC<OperatorChannelSelectProps> = ({
  packageManifest,
  selectedUpdateChannel,
  setUpdateChannel,
  setUpdateVersion,
}) => {
  const { t } = useTranslation();
  const { setQueryArgument } = useQueryParamsMutator();
  const channels = useMemo(() => packageManifest?.status.channels ?? [], [packageManifest]);
  const [isChannelSelectOpen, setIsChannelSelectOpen] = useState(false);
  const { setDeprecatedChannel } = useDeprecatedOperatorWarnings();

  const selectedChannel =
    selectedUpdateChannel || packageManifest?.status.defaultChannel || channels[0]?.name;

  const getChannelLabel = (ch) => (
    <>
      {ch?.name || '-'}{' '}
      {ch?.deprecation && (
        <DeprecatedOperatorWarningIcon
          deprecation={ch?.deprecation}
          dataTest="deprecated-operator-warning-channel-icon"
        />
      )}
    </>
  );

  const channelSelectOptions = channels
    .sort((a, b) => -alphanumericCompare(a.name, b.name))
    .map((ch) => (
      <SelectOption
        key={ch.name}
        id={ch.name}
        value={ch.name}
        data-test={`channel-option-${ch.name}`}
      >
        {getChannelLabel(ch)}
      </SelectOption>
    ));

  useEffect(() => {
    setQueryArgument('channel', selectedChannel);
    setDeprecatedChannel(
      _.pick(
        channels.find((f) => f.deprecation && f.name === selectedChannel),
        'deprecation',
      ),
    );
  }, [selectedChannel, channels, setDeprecatedChannel, setQueryArgument]);

  return (
    <>
      <Select
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsChannelSelectOpen((prev) => !prev)}
            isExpanded={isChannelSelectOpen}
            isDisabled={!packageManifest}
            isFullWidth
            aria-label={t('olm~Select a channel')}
            className="co-operator-channel__select"
            data-test="operator-channel-select-toggle"
          >
            {getChannelLabel(channels.find((f) => f.name === selectedUpdateChannel))}
          </MenuToggle>
        )}
        onSelect={(event: MouseEvent | ChangeEvent, value: string) => {
          setUpdateChannel(value);
          setIsChannelSelectOpen(false);
          setUpdateVersion('');
        }}
        selected={selectedChannel || '-'}
        onOpenChange={(isOpen) => setIsChannelSelectOpen(isOpen)}
        isOpen={isChannelSelectOpen}
        isScrollable
      >
        <SelectList>{channelSelectOptions}</SelectList>
      </Select>
    </>
  );
};

type OperatorChannelSelectProps = {
  packageManifest: PackageManifestKind;
  selectedUpdateChannel: string;
  setUpdateChannel: (updateChannel: string) => void;
  setUpdateVersion: (updateVersion: string) => void;
};

export const OperatorVersionSelect: FC<OperatorVersionSelectProps> = ({
  packageManifest,
  selectedUpdateChannel,
  updateVersion,
  setUpdateVersion,
  showVersionAlert = false,
}) => {
  const { t } = useTranslation();
  const { setQueryArgument } = useQueryParamsMutator();
  const { setDeprecatedVersion } = useDeprecatedOperatorWarnings();
  const [isVersionSelectOpen, setIsVersionSelectOpen] = useState(false);
  const [defaultVersionForChannel, setDefaultVersionForChannel] = useState('-');
  const { channels = [] } = packageManifest?.status ?? {};

  useEffect(() => {
    setDefaultVersionForChannel(
      channels.find((ch) => ch.name === selectedUpdateChannel)?.currentCSVDesc?.version ?? '-',
    );
  }, [channels, selectedUpdateChannel]);

  const selectedUpdateVersion = updateVersion || defaultVersionForChannel;

  // Return all versions associated with selectedUpdateChannel
  const selectedChannelVersions = useMemo(
    () => channels.find((ch) => ch.name === selectedUpdateChannel)?.entries ?? [],
    [channels, selectedUpdateChannel],
  );

  const getVersionLabel = (v) => (
    <>
      {v?.version ?? '-'}{' '}
      {v?.deprecation && (
        <DeprecatedOperatorWarningIcon
          deprecation={v?.deprecation}
          dataTest="deprecated-operator-warning-version-icon"
        />
      )}
    </>
  );

  const versionSelectOptions = selectedChannelVersions.map((v) => (
    <SelectOption
      key={v.version}
      id={v.version}
      value={v.version}
      data-test={`version-option-${v.name}`}
    >
      {getVersionLabel(v)}
    </SelectOption>
  ));

  useEffect(() => {
    setQueryArgument('version', selectedUpdateVersion);
    setDeprecatedVersion(
      _.pick(
        selectedChannelVersions.find((f) => f.deprecation && f.version === selectedUpdateVersion),
        'deprecation',
      ),
    );
  }, [selectedUpdateVersion, selectedChannelVersions, setDeprecatedVersion, setQueryArgument]);

  return (
    <>
      <Select
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsVersionSelectOpen((prev) => !prev)}
            isExpanded={isVersionSelectOpen}
            isDisabled={!packageManifest}
            isFullWidth
            aria-label={t('olm~Select a version')}
            className="co-operator-version__select"
            data-test="operator-version-select-toggle"
          >
            {getVersionLabel(
              selectedChannelVersions.find((v) => v.version === selectedUpdateVersion),
            )}
          </MenuToggle>
        )}
        onSelect={(event: MouseEvent | ChangeEvent, value: string) => {
          setUpdateVersion(value);
          setIsVersionSelectOpen(false);
        }}
        selected={selectedUpdateVersion}
        onOpenChange={(isOpen) => setIsVersionSelectOpen(isOpen)}
        isOpen={isVersionSelectOpen}
        isScrollable
      >
        <SelectList>{versionSelectOptions}</SelectList>
      </Select>
      {showVersionAlert && selectedUpdateVersion !== defaultVersionForChannel && (
        <Alert
          variant="info"
          isInline
          className="co-alert co-alert--margin-top co-alert__update-approval"
          title={t(
            'olm~Manual update approval is required when not installing the latest version for the selected channel.',
          )}
        />
      )}
    </>
  );
};

type OperatorVersionSelectProps = {
  packageManifest: PackageManifestKind;
  selectedUpdateChannel: string;
  updateVersion: string;
  setUpdateVersion: (updateVersion: string) => void;
  showVersionAlert?: boolean;
};
