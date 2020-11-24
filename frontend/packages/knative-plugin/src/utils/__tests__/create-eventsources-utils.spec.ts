import * as _ from 'lodash';
import { safeDump } from 'js-yaml';
import * as k8sModels from '@console/internal/module/k8s';
import * as utils from '@console/internal/components/utils';
import {
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
  EventSourceCamelModel,
} from '../../models';
import {
  getEventSourceResource,
  getBootstrapServers,
  loadYamlData,
  getEventSourcesDepResource,
  sortSourcesData,
  getEventSourceConnectorList,
  getEventSourceList,
  getEventSourceData,
  sanitizeKafkaSourceResource,
} from '../create-eventsources-utils';
import {
  getDefaultEventingData,
  Kafkas,
  eventSourcesObj,
  camelCsvData,
} from './knative-serving-data';
import { EventSources } from '../../components/add/import-types';

describe('Create knative Utils', () => {
  it('expect response to be of kind CronJobSource with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.formData.apiVersion = 'sources.eventing.knative.dev/v1alpha1';
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCronJobModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
    );
  });

  it('expect response to schedule in spec for CronJobSource', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.schedule).toBe('* * * * *');
  });

  it('expect response for sink to be of kind knative service', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.sink.ref.kind).toBe(ServiceModel.kind);
    expect(knEventingResource.spec.sink.ref.apiVersion).toBe(
      `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    );
  });

  it('expect response to be of kind sinkBinding with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.formData.type = 'SinkBinding';
    mockData.formData.apiVersion = 'sources.knative.dev/v1alpha2';
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceSinkBindingModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
    );
  });

  it('should return bootstrapServers', () => {
    expect(getBootstrapServers(Kafkas)).toEqual([
      'my-cluster-kafka-bootstrap.div.svc:9092',
      'my-cluster-kafka-bootstrap.div.svc:9093',
      'my-cluster2-kafka-bootstrap.div.svc:9092',
      'my-cluster2-kafka-bootstrap.div.svc:9093',
    ]);
  });

  it('expect response of loadYamlData to have namespace as passed in yamlEditor', () => {
    jest.spyOn(k8sModels, 'modelFor').mockImplementation(() => EventSourceCamelModel);
    const defaultEventingData = getDefaultEventingData(EventSourceCamelModel.kind);
    const mockData = {
      ...defaultEventingData,
      yamlData: safeDump(getEventSourcesDepResource(defaultEventingData.formData)),
    };
    const knEventingResource: k8sModels.K8sResourceKind = loadYamlData(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCamelModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCamelModel.apiGroup}/${EventSourceCamelModel.apiVersion}`,
    );
    expect(knEventingResource.metadata?.namespace).toEqual('mock-project');
  });

  it('expect response of loadYamlData to update namespace if not there yamlEditor', () => {
    jest.spyOn(k8sModels, 'modelFor').mockImplementation(() => EventSourceCamelModel);
    const defaultEventingData = getDefaultEventingData(EventSourceCamelModel.kind);
    defaultEventingData.formData.project.name = '';
    const mockData = {
      ...getDefaultEventingData(EventSourceCamelModel.kind),
      yamlData: safeDump(getEventSourcesDepResource(defaultEventingData.formData)),
    };
    const knEventingResource: k8sModels.K8sResourceKind = loadYamlData(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCamelModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCamelModel.apiGroup}/${EventSourceCamelModel.apiVersion}`,
    );
    expect(knEventingResource.metadata?.namespace).toEqual('mock-project');
  });

  it('expect sortSourcesData to sort based on builtinSources, followed by camel, follwed by camelConnectors and dynamic sourced', () => {
    const sortedSourcesData = sortSourcesData(eventSourcesObj);

    expect(Object.keys(sortedSourcesData)).toEqual([
      'ApiServerSource',
      'PingSource',
      'CamelSource',
      'jira',
      'GitHubSource',
    ]);
  });

  it('expect getEventSourceList to return proper builtinSources', (done) => {
    const eventSourcesModel: k8sModels.K8sKind[] = [
      EventSourceCronJobModel,
      EventSourceSinkBindingModel,
      EventSourceKafkaModel,
      EventSourceCamelModel,
    ];
    spyOn(utils, 'checkAccess').and.callFake(() => Promise.resolve({ status: { allowed: true } }));
    const eventSourceData = getEventSourceList('my-app', eventSourcesModel);
    Promise.all(eventSourceData)
      .then((results) => {
        expect(results).toHaveLength(4);
        done();
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.warn(err.message));
  });

  it('expect getEventSourceConnectorList to return 5 camelK connector', (done) => {
    spyOn(utils, 'checkAccess').and.callFake(() => Promise.resolve({ status: { allowed: true } }));
    const eventSourceConnectorData = getEventSourceConnectorList('my-app', camelCsvData);
    Promise.all(eventSourceConnectorData)
      .then((results) => {
        expect(results).toHaveLength(5);
        done();
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.warn(err.message));
  });

  it('expect getEventSourceData should return data for builtin Sources', () => {
    expect(getEventSourceData(EventSources.PingSource).jsonData).toBeDefined();
    expect(getEventSourceData(EventSources.PingSource).schedule).toBeDefined();

    expect(getEventSourceData(EventSources.CronJobSource).data).toBeDefined();
    expect(getEventSourceData(EventSources.CronJobSource).schedule).toBeDefined();

    expect(getEventSourceData(EventSources.SinkBinding).subject).toBeDefined();
    expect(getEventSourceData(EventSources.SinkBinding).subject.apiVersion).toBeDefined();
    expect(getEventSourceData(EventSources.SinkBinding).subject.kind).toBeDefined();
    expect(getEventSourceData(EventSources.SinkBinding).subject.selector).toBeDefined();
    expect(getEventSourceData(EventSources.SinkBinding).subject.selector.matchLabels).toBeDefined();

    expect(getEventSourceData(EventSources.ApiServerSource).mode).toBeDefined();
    expect(getEventSourceData(EventSources.ApiServerSource).serviceAccountName).toBeDefined();
    expect(getEventSourceData(EventSources.ApiServerSource).resources).toHaveLength(1);

    expect(getEventSourceData(EventSources.ContainerSource).template).toBeDefined();
    expect(getEventSourceData(EventSources.ContainerSource).template.spec).toBeDefined();
    expect(getEventSourceData(EventSources.ContainerSource).template.spec.containers).toHaveLength(
      1,
    );

    expect(getEventSourceData(EventSources.KafkaSource).bootstrapServers).toHaveLength(0);
    expect(getEventSourceData(EventSources.KafkaSource).topics).toHaveLength(0);
    expect(getEventSourceData(EventSources.KafkaSource).consumerGroup).toBeDefined();
    expect(getEventSourceData(EventSources.KafkaSource).net).toBeDefined();
    expect(getEventSourceData(EventSources.KafkaSource).net.sasl).toBeDefined();
    expect(getEventSourceData(EventSources.KafkaSource).net.tls).toBeDefined();
  });

  it('expect getEventSourceData should return undefined for dynamic Sources', () => {
    expect(getEventSourceData('gcpsource')).toBeUndefined();
  });

  it('expect sanitizeKafkaSourceResource should return valid values for form', () => {
    const KafkaSourceData = getDefaultEventingData(EventSources.KafkaSource);
    expect(sanitizeKafkaSourceResource(KafkaSourceData.formData)).toBeDefined();
  });

  it('expect sanitizeKafkaSourceResource should return default values for form if data is not present', () => {
    const KafkaSourceData = _.omit(
      getDefaultEventingData(EventSources.KafkaSource),
      'formData.data',
    );
    expect(sanitizeKafkaSourceResource(KafkaSourceData.formData)).toBeDefined();
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource]
        .bootstrapServers,
    ).toEqual([]);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].topics,
    ).toEqual([]);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource]
        .consumerGroup,
    ).toEqual('');
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .enable,
    ).toEqual(false);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .user,
    ).toEqual({ secretKeyRef: { name: '', key: '' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .password,
    ).toEqual({ secretKeyRef: { name: '', key: '' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .enable,
    ).toEqual(false);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .caCert,
    ).toEqual({ secretKeyRef: { name: '', key: '' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .cert,
    ).toEqual({ secretKeyRef: { name: '', key: '' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .key,
    ).toEqual({ secretKeyRef: { name: '', key: '' } });
  });

  it('expect sanitizeKafkaSourceResource should return values from form if valid', () => {
    const KafkaSourceData = getDefaultEventingData(EventSources.KafkaSource);
    KafkaSourceData.formData.data[EventSources.KafkaSource] = {
      ...KafkaSourceData.formData.data[EventSources.KafkaSource],
      bootstrapServers: ['server1', 'server2'],
      topics: ['topic1'],
      consumerGroup: 'knative-group',
      net: {
        sasl: {
          enable: true,
          user: { secretKeyRef: { name: 'username', key: 'userkey' } },
          password: { secretKeyRef: { name: 'passwordname', key: 'passwordkey' } },
        },
        tls: {
          enable: true,
          caCert: { secretKeyRef: { name: 'cacertname', key: 'cacertkey' } },
          cert: { secretKeyRef: { name: 'certname', key: 'certkey' } },
          key: { secretKeyRef: { name: 'key', key: 'key1' } },
        },
      },
    };
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource]
        .bootstrapServers,
    ).toHaveLength(2);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].topics,
    ).toHaveLength(1);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource]
        .consumerGroup,
    ).toEqual('knative-group');

    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .enable,
    ).toEqual(true);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .user,
    ).toEqual({ secretKeyRef: { name: 'username', key: 'userkey' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.sasl
        .password,
    ).toEqual({ secretKeyRef: { name: 'passwordname', key: 'passwordkey' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .enable,
    ).toEqual(true);
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .caCert,
    ).toEqual({ secretKeyRef: { name: 'cacertname', key: 'cacertkey' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .cert,
    ).toEqual({ secretKeyRef: { name: 'certname', key: 'certkey' } });
    expect(
      sanitizeKafkaSourceResource(KafkaSourceData.formData).data[EventSources.KafkaSource].net.tls
        .key,
    ).toEqual({ secretKeyRef: { name: 'key', key: 'key1' } });
  });
});
