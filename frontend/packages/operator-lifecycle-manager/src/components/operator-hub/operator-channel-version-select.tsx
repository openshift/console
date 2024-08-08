import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import {
  Select as SelectDeprecated,
  SelectOption as SelectOptionDeprecated,
} from '@patternfly/react-core/deprecated';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { setQueryArgument } from '@console/internal/components/utils';
import { alphanumericCompare } from '@console/shared';
import { PackageManifestKind } from '../../types';
import { DeprecatedOperatorWarningIcon } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { useDeprecatedOperatorWarnings } from '../deprecated-operator-warnings/use-deprecated-operator-warnings';

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
  const { setDeprecatedChannel } = useDeprecatedOperatorWarnings();
  channels.sort((a, b) => -alphanumericCompare(a.name, b.name));

  const channelSelectOptions = channels.map((ch) => (
    <SelectOptionDeprecated key={ch.name} id={ch.name} value={ch.name}>
      {ch.name} {ch?.deprecation && <DeprecatedOperatorWarningIcon deprecation={ch?.deprecation} />}
    </SelectOptionDeprecated>
  ));

  React.useEffect(() => {
    setQueryArgument('channel', selectedUpdateChannel);
    setDeprecatedChannel(
      _.pick(
        channels.find((f) => f.deprecation && f.name === selectedUpdateChannel),
        'deprecation',
      ),
    );
  }, [selectedUpdateChannel, channels, setDeprecatedChannel]);

  const handleChannelSelection = (_c, newSelected: string) => {
    setUpdateChannel(newSelected);
    setIsChannelSelectOpen(false);
    setUpdateVersion('');
  };

  return (
    <>
      <SelectDeprecated
        className="co-operator-channel__select"
        aria-label={t('olm~Select a channel')}
        onToggle={onToggleChannel}
        isOpen={isChannelSelectOpen}
        selections={selectedUpdateChannel}
        onSelect={handleChannelSelection}
      >
        {channelSelectOptions}
      </SelectDeprecated>
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
  const { setDeprecatedVersion } = useDeprecatedOperatorWarnings();
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

  const handleVersionSelection = (_v, newSelection) => {
    setUpdateVersion(newSelection);
    setIsVersionSelectOpen(false);
  };
  const versionSelectOptions = selectedChannelVersions.map((v) => (
    <SelectOptionDeprecated key={v.version} id={v.version} value={v.version}>
      {v.version} {v?.deprecation && <DeprecatedOperatorWarningIcon deprecation={v?.deprecation} />}
    </SelectOptionDeprecated>
  ));

  React.useEffect(() => {
    setQueryArgument('version', selectedUpdateVersion);
    setDeprecatedVersion(
      _.pick(
        selectedChannelVersions.find((f) => f.deprecation && f.version === selectedUpdateVersion),
        'deprecation',
      ),
    );
  }, [selectedUpdateVersion, selectedChannelVersions, setDeprecatedVersion]);

  return (
    <>
      <SelectDeprecated
        className="co-operator-version__select"
        aria-label={t('olm~Select a version')}
        onToggle={onToggleVersion}
        isOpen={isVersionSelectOpen}
        selections={selectedUpdateVersion}
        onSelect={handleVersionSelection}
      >
        {versionSelectOptions}
      </SelectDeprecated>

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
