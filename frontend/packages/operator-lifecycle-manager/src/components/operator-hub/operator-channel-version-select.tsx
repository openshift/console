import * as React from 'react';
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
  const channels = React.useMemo(() => packageManifest?.status.channels ?? [], [packageManifest]);
  const [isChannelSelectOpen, setIsChannelSelectOpen] = React.useState(false);
  const { setDeprecatedChannel } = useDeprecatedOperatorWarnings();
  channels.sort((a, b) => -alphanumericCompare(a.name, b.name));

  const getChannelLabel = (ch) => (
    <>
      {ch.name}{' '}
      {ch?.deprecation && (
        <DeprecatedOperatorWarningIcon
          deprecation={ch?.deprecation}
          dataTest="deprecated-operator-warning-channel-icon"
        />
      )}
    </>
  );

  const channelSelectOptions = channels.map((ch) => (
    <SelectOption
      key={ch.name}
      id={ch.name}
      value={ch.name}
      data-test={`channel-option-${ch.name}`}
    >
      {getChannelLabel(ch)}
    </SelectOption>
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

  return (
    <>
      <Select
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
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
        onSelect={(event: React.MouseEvent | React.ChangeEvent, value: string) => {
          setUpdateChannel(value);
          setIsChannelSelectOpen(false);
          setUpdateVersion('');
        }}
        selected={selectedUpdateChannel || '-'}
        onOpenChange={(isOpen) => setIsChannelSelectOpen(isOpen)}
        isOpen={isChannelSelectOpen}
        maxMenuHeight
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
  const { channels = [] } = packageManifest?.status ?? {};

  React.useEffect(() => {
    setDefaultVersionForChannel(
      channels.find((ch) => ch.name === selectedUpdateChannel)?.currentCSVDesc?.version ?? '-',
    );
  }, [channels, selectedUpdateChannel]);

  const selectedUpdateVersion = updateVersion || defaultVersionForChannel;

  // Return all versions associated with selectedUpdateChannel
  const selectedChannelVersions = React.useMemo(
    () => channels.find((ch) => ch.name === selectedUpdateChannel)?.entries ?? [],
    [channels, selectedUpdateChannel],
  );

  const getVersionLabel = (v) => (
    <>
      {v?.version}{' '}
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
      <Select
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
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
        onSelect={(event: React.MouseEvent | React.ChangeEvent, value: string) => {
          setUpdateVersion(value);
          setIsVersionSelectOpen(false);
        }}
        selected={selectedUpdateVersion}
        onOpenChange={(isOpen) => setIsVersionSelectOpen(isOpen)}
        isOpen={isVersionSelectOpen}
        maxMenuHeight
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
