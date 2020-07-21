import * as React from 'react';
import * as _ from 'lodash';
import { useField } from 'formik';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { DropdownField, DropdownFieldProps } from '@console/shared';
import { getChannelKind } from '../../../../utils/create-channel-utils';
import { EventingChannelModel } from '../../../../models';

type ChannelSelectorProps = {
  channels: string[];
  defaultConfiguredChannel: string;
  defaultConfiguredChannelLoaded: boolean;
} & Omit<DropdownFieldProps, 'name'>;

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channels,
  onChange,
  defaultConfiguredChannel,
  defaultConfiguredChannelLoaded,
}) => {
  const [selected] = useField('type');

  const filteredChannels = _.chain(channels)
    .filter((ch) => EventingChannelModel.kind !== getChannelKind(ch))
    .partition((ref) => getChannelKind(ref) === defaultConfiguredChannel)
    .flatten()
    .value();

  const channelData = filteredChannels.reduce((acc, channel) => {
    const channelName = getChannelKind(channel);
    acc[channel] =
      channelName === defaultConfiguredChannel ? `${channelName} (Default)` : channelName;
    return acc;
  }, {});

  const getDefaultChannel = React.useCallback((): string => {
    return (
      filteredChannels.find((ch) => getChannelKind(ch) === defaultConfiguredChannel) ||
      filteredChannels[0]
    );
  }, [defaultConfiguredChannel, filteredChannels]);

  React.useEffect(() => {
    if (!selected.value && defaultConfiguredChannelLoaded && filteredChannels.length > 0) {
      const channel = getDefaultChannel();
      onChange && onChange(channel);
    }
  }, [
    selected.value,
    defaultConfiguredChannelLoaded,
    getDefaultChannel,
    onChange,
    filteredChannels.length,
  ]);

  return (
    <FormSection extraMargin>
      <DropdownField
        name="type"
        label="Type"
        items={channelData}
        title="Type"
        onChange={onChange}
        fullWidth
        required
      />
    </FormSection>
  );
};

export default ChannelSelector;
