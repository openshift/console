import { Operator } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  TestPodModel,
  TestDeploymentModel,
  TestClusterResourceQuotaModel,
  TestPrometheusModel,
} from '../__mocks__/k8s-data';
import { getReferenceForModel } from '../k8s-ref';
import { createEquals, requirementToString, modelsToMap } from '../k8s-utils';

describe('k8sUtils', () => {
  describe('requirementToString', () => {
    [
      {
        requirement: { key: 'key1', operator: Operator.Equals, values: ['value1', 'value2'] },
        string: 'key1=value1',
      },

      {
        requirement: { key: 'key1', operator: Operator.NotEquals, values: ['value1', 'value2'] },
        string: 'key1!=value1',
      },

      {
        requirement: { key: 'key1', operator: Operator.Exists, values: ['value1'] },
        string: 'key1',
      },

      {
        requirement: { key: 'key1', operator: Operator.DoesNotExist, values: ['value1'] },
        string: '!key1',
      },

      {
        requirement: { key: 'key1', operator: Operator.In, values: ['value1', 'value2'] },
        string: 'key1 in (value1,value2)',
      },

      {
        requirement: { key: 'key1', operator: Operator.NotIn, values: ['value1', 'value2'] },
        string: 'key1 notin (value1,value2)',
      },

      {
        requirement: { key: 'key1', operator: Operator.GreaterThan, values: ['666.999'] },
        string: 'key1 > 666.999',
      },

      {
        requirement: { key: 'key1', operator: Operator.LessThan, values: ['666.999'] },
        string: 'key1 < 666.999',
      },
    ].forEach((t) => {
      it(`returns string for ${JSON.stringify(t.requirement)} requirement`, () => {
        expect(requirementToString(t.requirement)).toEqual(t.string);
      });
    });

    it('returns falsy for unknown requirement', () => {
      expect(
        requirementToString({ key: 'key1', operator: 'Oops!', values: ['value1'] }),
      ).toBeFalsy();
    });
  });

  describe('createEquals', () => {
    it('returns "Equals" requirement object', () => {
      expect(createEquals('Key', 'Value')).toEqual({
        key: 'Key',
        operator: 'Equals',
        values: ['Value'],
      });
    });
  });

  describe('modelsToMap', () => {
    it('returns a map with keys based on model.kind for models with crd:false', () => {
      expect(modelsToMap([TestPodModel, TestDeploymentModel]).toObject()).toEqual({
        [TestPodModel.kind]: TestPodModel,
        [TestDeploymentModel.kind]: TestDeploymentModel,
      });
    });

    it('returns a map with keys based on referenceForModel for models with crd:true', () => {
      expect(modelsToMap([TestClusterResourceQuotaModel, TestPrometheusModel]).toObject()).toEqual({
        [getReferenceForModel(TestClusterResourceQuotaModel)]: TestClusterResourceQuotaModel,
        [getReferenceForModel(TestPrometheusModel)]: TestPrometheusModel,
      });
    });
  });
});
