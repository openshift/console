import { apiVersionForModel } from '@console/internal/module/k8s';
import { EventingBrokerModel } from '../../../../models';
import { LABEL_PART_OF, EVENT_BROKER_APP } from '../../const';
import { convertFormToBrokerYaml, addBrokerInitialValues } from '../add-broker-utils';

describe('broker-utils: ', () => {
  describe('convertFormtoBroker', () => {
    it('should contain all the top level keys for broker', () => {
      const formValues = addBrokerInitialValues('test-ns', '');
      const broker = convertFormToBrokerYaml(formValues);
      expect(broker.apiVersion).toBe(apiVersionForModel(EventingBrokerModel));
      expect(broker.kind).toBe(EventingBrokerModel.kind);
      expect(broker.metadata).toBeDefined();
      expect(broker.spec).toBeDefined();
    });

    it('should contain default application name', () => {
      const formValues = addBrokerInitialValues('test-ns', '');
      const broker = convertFormToBrokerYaml(formValues);
      expect(broker.metadata.labels[LABEL_PART_OF]).toBe(EVENT_BROKER_APP);
    });

    it('should contain custom application name', () => {
      const formValues = addBrokerInitialValues('test-ns', 'custom-group-name');
      const broker = convertFormToBrokerYaml(formValues);
      expect(broker.metadata.labels[LABEL_PART_OF]).toBe('custom-group-name');
    });

    it('should not contain the metadata labels', () => {
      const formValues = addBrokerInitialValues('test-ns', '');

      const broker = convertFormToBrokerYaml({
        ...formValues,
        formData: {
          ...formValues.formData,
          application: {
            initial: null,
            name: '',
            selectedKey: '',
          },
        },
      });
      expect(broker.metadata.labels).toBeUndefined();
    });
  });
});
