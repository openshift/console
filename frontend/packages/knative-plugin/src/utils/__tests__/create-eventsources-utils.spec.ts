import { safeDump } from 'js-yaml';
import * as _ from 'lodash';
import * as utils from '@console/internal/components/utils';
import * as k8sModels from '@console/internal/module/k8s';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '@console/topology/src/const';
import { EventSourceFormData, EventSources } from '../../components/add/import-types';
import {
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
  EventSourceCamelModel,
  EventSourcePingModel,
} from '../../models';
import { MockKnativeResources } from '../../topology/__tests__/topology-knative-test-data';
import {
  getBootstrapServers,
  loadYamlData,
  getEventSourcesDepResource,
  getEventSourceModelsWithAccess,
  getEventSourceData,
  sanitizeKafkaSourceResource,
  sanitizeSourceToForm,
  isSecretKeyRefPresent,
  getKafkaSourceResource,
  formDescriptorData,
} from '../create-eventsources-utils';
import { getDefaultEventingData, Kafkas } from './knative-serving-data';

describe('Create knative Utils', () => {
  it('should return bootstrapServers', () => {
    expect(getBootstrapServers(Kafkas)).toEqual([
      'my-cluster-kafka-bootstrap.div.svc:9092',
      'my-cluster-kafka-bootstrap.div.svc:9093',
      'my-cluster2-kafka-bootstrap.div.svc:9092',
      'my-cluster2-kafka-bootstrap.div.svc:9093',
      'jai-test--qcxzgigqva-d-bxib-gn-g--ni.kafka.devshift.org:443',
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

  it('expect getEventSourceModelsWithAccess to return proper builtinSources', (done) => {
    const eventSourcesModel: k8sModels.K8sKind[] = [
      EventSourceCronJobModel,
      EventSourceSinkBindingModel,
      EventSourceKafkaModel,
      EventSourceCamelModel,
    ];
    spyOn(utils, 'checkAccess').and.callFake(() => Promise.resolve({ status: { allowed: true } }));
    const eventSourceData = getEventSourceModelsWithAccess('my-app', eventSourcesModel);
    Promise.all(eventSourceData)
      .then((results) => {
        expect(results).toHaveLength(4);
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

describe('sanitizeSourceToForm always returns valid Event Source', () => {
  const formDataValues: EventSourceFormData = {
    project: { name: 'demo-sources', displayName: '', description: '' },
    application: { initial: '', name: 'event-sources-app', selectedKey: 'event-sources-app' },
    name: 'ping-source',
    apiVersion: 'sources.knative.dev/v1beta1',
    sinkType: 'resource',
    sink: {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Service',
      name: 'event-display',
      key: 'Service-event-display',
      uri: '',
    },
    type: 'PingSource',
    data: { PingSource: { jsonData: '', schedule: '' } },
  };

  it('expect an empty form to return a EventSource data with updated properties', () => {
    const pingSourceData: k8sModels.K8sResourceKind =
      MockKnativeResources[k8sModels.referenceForModel(EventSourcePingModel)].data[0];
    const newFormDataValue = {
      ...pingSourceData,
      spec: {
        schedule: '@daily',
        data: 'test1',
      },
    };
    const formData = sanitizeSourceToForm(newFormDataValue, formDataValues);
    expect(formData).toBeTruthy();
    expect(formData.type).toBe(EventSourcePingModel.kind);
    expect(formData.data[EventSourcePingModel.kind].jsonData).toBeUndefined();
    expect(formData.data[EventSourcePingModel.kind].schedule).toEqual('@daily');
    expect(formData.data[EventSourcePingModel.kind].data).toEqual('test1');
  });

  it('expect an empty form to return a EventSource data with proper application group if partof added', () => {
    const pingSourceData: k8sModels.K8sResourceKind =
      MockKnativeResources[k8sModels.referenceForModel(EventSourcePingModel)].data[0];
    const newFormDataValue = {
      ...pingSourceData,
      metadata: {
        ...pingSourceData.metadata,
        labels: {
          'app.kubernetes.io/part-of': 'test-app',
        },
      },
    };
    const formData = sanitizeSourceToForm(newFormDataValue, formDataValues);
    expect(formData).toBeTruthy();
    expect(formData.type).toBe(EventSourcePingModel.kind);
    expect(formData.application.name).toEqual('test-app');
    expect(formData.application.selectedKey).toEqual(CREATE_APPLICATION_KEY);
  });

  it('expect an empty form to return a EventSource data with proper application group if partof not added', () => {
    const pingSourceData: k8sModels.K8sResourceKind =
      MockKnativeResources[k8sModels.referenceForModel(EventSourcePingModel)].data[0];
    const formData = sanitizeSourceToForm(pingSourceData, formDataValues);
    expect(formData).toBeTruthy();
    expect(formData.type).toBe(EventSourcePingModel.kind);
    expect(formData.application.name).toEqual('');
    expect(formData.application.selectedKey).toEqual(UNASSIGNED_KEY);
  });

  it('expect true if secretKeyRef is there for name or key or both', () => {
    expect(isSecretKeyRefPresent({ secretKeyRef: { name: 'my-sasl-secret', key: 'user' } })).toBe(
      true,
    );
    expect(isSecretKeyRefPresent({ secretKeyRef: { name: 'my-sasl-secret', key: '' } })).toBe(true);
    expect(isSecretKeyRefPresent({ secretKeyRef: { name: '', key: 'user' } })).toBe(true);
  });

  it('expect false if secretKeyRef is not there for name and key', () => {
    expect(isSecretKeyRefPresent({ secretKeyRef: { name: '', key: '' } })).toBe(false);
    expect(isSecretKeyRefPresent(null)).toBe(false);
  });

  it('expect getKafkaSourceResource to return sasl and tls with secrets if enabled and present', () => {
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
          caCert: { secretKeyRef: { name: '', key: '' } },
          cert: { secretKeyRef: { name: '', key: '' } },
          key: { secretKeyRef: { name: '', key: '' } },
        },
      },
    };
    const {
      spec: {
        net: { sasl, tls },
      },
    } = getKafkaSourceResource(KafkaSourceData);
    expect(sasl.enable).toBe(true);
    expect(sasl.user).toEqual({
      secretKeyRef: { name: 'username', key: 'userkey' },
    });
    expect(tls).toEqual({ enable: true, caCert: {}, cert: {}, key: {} });
  });

  it('expect getKafkaSourceResource to return sasl and tls without secrets if not enabled', () => {
    const KafkaSourceData = getDefaultEventingData(EventSources.KafkaSource);
    KafkaSourceData.formData.data[EventSources.KafkaSource] = {
      ...KafkaSourceData.formData.data[EventSources.KafkaSource],
      bootstrapServers: ['server1', 'server2'],
      topics: ['topic1'],
      consumerGroup: 'knative-group',
      net: {
        sasl: {
          enable: false,
          user: { secretKeyRef: { name: '', key: '' } },
          password: { secretKeyRef: { name: '', key: '' } },
        },
        tls: {
          enable: false,
          caCert: { secretKeyRef: { name: '', key: '' } },
          cert: { secretKeyRef: { name: '', key: '' } },
          key: { secretKeyRef: { name: '', key: '' } },
        },
      },
    };
    const {
      spec: {
        net: { sasl, tls },
      },
    } = getKafkaSourceResource(KafkaSourceData);
    expect(sasl.enable).toBeUndefined();
    expect(sasl).toEqual({ user: {}, password: {} });
    expect(tls.enable).toBeUndefined();
    expect(tls).toEqual({ caCert: {}, cert: {}, key: {} });
  });
});

describe('form descriptors form json schema for kamelets', () => {
  it('should return formDescriptorData for provided JsonSchema with string, integer, boolean', () => {
    const properties = {
      accessKey: {
        description: 'The access key obtained from AWS',
        format: 'password',
        title: 'Access Key',
        type: 'string',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      paritions: {
        description: 'The number of partitions',
        title: 'Partitions',
        type: 'integer',
      },
      source: {
        description: 'Enable source',
        title: 'Source',
        type: 'boolean',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
      },
    };
    expect(formDescriptorData(properties)).toEqual([
      {
        description: 'The access key obtained from AWS',
        displayName: 'Access Key',
        path: 'accessKey',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      {
        description: 'The number of partitions',
        displayName: 'Partitions',
        path: 'paritions',
      },
      {
        description: 'Enable source',
        displayName: 'Source',
        path: 'source',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
      },
    ]);
  });

  it('should return formDescriptorData for provided JsonSchema with type object', () => {
    const properties = {
      accessKey: {
        description: 'The access key obtained from AWS',
        format: 'password',
        title: 'Access Key',
        type: 'string',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      paritionsData: {
        description: 'The Partitions Data',
        title: 'Partitions Data',
        type: 'object',
        properties: {
          paritions: {
            description: 'The number of partitions',
            title: 'Partitions',
            type: 'integer',
          },
          source: {
            description: 'Enable source',
            title: 'Source',
            type: 'boolean',
            'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
          },
        },
      },
    };
    expect(formDescriptorData(properties)).toEqual([
      {
        description: 'The access key obtained from AWS',
        displayName: 'Access Key',
        path: 'accessKey',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      {
        description: 'The number of partitions',
        displayName: 'Partitions',
        path: 'paritionsData.paritions',
      },
      {
        description: 'Enable source',
        displayName: 'Source',
        path: 'paritionsData.source',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
      },
    ]);
  });

  it('should return formDescriptorData for provided JsonSchema with type array of object', () => {
    const properties = {
      accessKey: {
        description: 'The access key obtained from AWS',
        format: 'password',
        title: 'Access Key',
        type: 'string',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      paritionsData: {
        description: 'The Partitions Data',
        title: 'Partitions Data',
        type: 'array',
        items: {
          title: 'Partition Object',
          description: 'The Partition Object',
          type: 'object',
          properties: {
            paritions: {
              description: 'The number of partitions',
              title: 'Partitions',
              type: 'integer',
            },
            source: {
              description: 'Enable source',
              title: 'Source',
              type: 'boolean',
              'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
            },
          },
        },
      },
    };
    expect(formDescriptorData(properties)).toEqual([
      {
        description: 'The access key obtained from AWS',
        displayName: 'Access Key',
        path: 'accessKey',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      {
        description: 'The number of partitions',
        displayName: 'Partitions',
        path: 'paritionsData[0].paritions',
      },
      {
        description: 'Enable source',
        displayName: 'Source',
        path: 'paritionsData[0].source',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
      },
    ]);
  });

  it('should return formDescriptorData for provided JsonSchema with type array', () => {
    const properties = {
      accessKey: {
        description: 'The access key obtained from AWS',
        format: 'password',
        title: 'Access Key',
        type: 'string',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      paritionsData: {
        description: 'The Partition Data',
        title: 'Partition Data',
        type: 'array',
        items: {
          description: 'Enable source',
          title: 'Source',
          type: 'boolean',
          'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
        },
      },
    };
    expect(formDescriptorData(properties)).toEqual([
      {
        description: 'The access key obtained from AWS',
        displayName: 'Access Key',
        path: 'accessKey',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:password'],
      },
      {
        description: 'Enable source',
        displayName: 'Source',
        path: 'paritionsData[0]',
        'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:booleanSwitch'],
      },
    ]);
  });
});
