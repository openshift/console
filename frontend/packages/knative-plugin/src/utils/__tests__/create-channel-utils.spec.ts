import { referenceFor } from '@console/internal/module/k8s';
import { EventingKafkaChannelModel, EventingIMCModel } from '../../models';
import { getCreateChannelResource } from '../create-channel-utils';
import { getDefaultChannelData } from './knative-serving-data';

describe('Create channel Utils', () => {
  it('should return the default data of the given reference', () => {
    const channelResource = getDefaultChannelData(referenceFor(EventingKafkaChannelModel));
    expect(channelResource.data.kafkachannel.numPartitions).toBe(1);
    expect(channelResource.data.kafkachannel.replicationFactor).toBe(1);
  });

  it('should return the data based on form fields for the known channels', () => {
    const channelResource = getDefaultChannelData(referenceFor(EventingKafkaChannelModel));
    const yamlIncludedResource = {
      ...channelResource,
      yamlData: JSON.stringify({
        kind: EventingIMCModel.kind,
        apiVersion: EventingIMCModel.apiVersion,
      }),
    };
    const formData = getCreateChannelResource(yamlIncludedResource);
    expect(formData.kind).not.toBe(EventingIMCModel.kind);
  });

  it('should return the data based on yaml section for the unknown channels', () => {
    const channelResource = getDefaultChannelData('NatsChannel');
    const yamlIncludedResource = {
      ...channelResource,
      yamlData: JSON.stringify({
        kind: 'NatsChannel',
        apiVersion: 'v1alpha1',
      }),
    };
    const formData = getCreateChannelResource(yamlIncludedResource);
    expect(formData.kind).toBe('NatsChannel');
  });
});
