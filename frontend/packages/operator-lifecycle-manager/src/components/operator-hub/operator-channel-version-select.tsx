import * as React from 'react';
import { Alert, Select, SelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { setQueryArgument } from '@console/internal/components/utils';
import { alphanumericCompare } from '@console/shared';
import { PackageManifestKind } from '../../types';

export const OperatorChannelSelect: React.FC<OperatorChannelSelectProps> = ({
  packageManifest,
  selectedUpdateChannel,
  setUpdateChannel,
  setUpdateVersion,
}) => {
  const { t } = useTranslation();
  const { channels = [] } = packageManifest.status;
  const [isChannelSelectOpen, setIsChannelSelectOpen] = React.useState(false);
  const onToggleChannel = () => setIsChannelSelectOpen(!isChannelSelectOpen);

  channels.sort((a, b) => -alphanumericCompare(a.name, b.name));

  const channelSelectOptions = channels.map((ch) => (
    <SelectOption key={ch.name} id={ch.name} value={ch.name}>
      {ch.name}
    </SelectOption>
  ));

  React.useEffect(() => {
    setQueryArgument('channel', selectedUpdateChannel);
  }, [selectedUpdateChannel]);

  const handleChannelSelection = (ch, newSelected: string) => {
    setUpdateChannel(newSelected);
    setIsChannelSelectOpen(false);
    setUpdateVersion('');
  };

  return (
    <>
      <Select
        className="co-operator-channel__select"
        aria-label={t('olm~Select a channel')}
        onToggle={onToggleChannel}
        isOpen={isChannelSelectOpen}
        selections={selectedUpdateChannel}
        onSelect={handleChannelSelection}
      >
        {channelSelectOptions}
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

export const OperatorVersionSelect: React.FC<OperatorVersionSelectProps> = ({
  packageManifest,
  selectedUpdateChannel,
  updateVersion,
  setUpdateVersion,
  showVersionAlert = false,
}) => {
  const { t } = useTranslation();
  const [isVersionSelectOpen, setIsVersionSelectOpen] = React.useState(false);
  const [defaultVersionForChannel, setDefaultVersionForChannel] = React.useState('');
  const { channels = [] } = packageManifest.status;

  React.useEffect(() => {
    setDefaultVersionForChannel(
      channels.find((ch) => ch.name === selectedUpdateChannel).currentCSVDesc.version,
    );
  }, [channels, selectedUpdateChannel]);

  const onToggleVersion = () => setIsVersionSelectOpen(!isVersionSelectOpen);

  const selectedUpdateVersion = updateVersion || defaultVersionForChannel;

  // Return all versions associated with selectedUpdateChannel
  const selectedChannelVersions = channels.find((ch) => ch.name === selectedUpdateChannel).entries;

  const handleVersionSelection = (versions, newSelection) => {
    setUpdateVersion(newSelection);
    setIsVersionSelectOpen(false);
  };
  const versionSelectOptions = selectedChannelVersions.map((v) => (
    <SelectOption key={v.version} id={v.version} value={v.version}>
      {v.version}
    </SelectOption>
  ));

  React.useEffect(() => {
    setQueryArgument('version', selectedUpdateVersion);
  }, [selectedUpdateVersion]);

  return (
    <>
      <Select
        className="co-operator-version__select"
        aria-label={t('olm~Select a version')}
        onToggle={onToggleVersion}
        isOpen={isVersionSelectOpen}
        selections={selectedUpdateVersion}
        onSelect={handleVersionSelection}
      >
        {versionSelectOptions}
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
