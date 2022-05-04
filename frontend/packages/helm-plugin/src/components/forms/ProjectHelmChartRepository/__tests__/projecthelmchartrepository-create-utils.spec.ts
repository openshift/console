import {
  convertToForm,
  convertToProjectHelmChartRepository,
  getDefaultResource,
} from '../projecthelmchartrepository-create-utils';
import {
  defaultProjectHelmChartRepository,
  sampleProjectHelmChartRepository,
  sampleProjectHelmChartRepositoryFormData,
} from './projecthelmchartrepository-data';

describe('ProjectHelmChartRepository create utils', () => {
  describe('convertToForm', () => {
    it('should convert to form', () => {
      const form = convertToForm(sampleProjectHelmChartRepository);
      expect(form).toEqual(sampleProjectHelmChartRepositoryFormData);
    });
  });
  describe('convertToProjectHelmChartRepository', () => {
    it('should convert to project helm chart repository', () => {
      const newProjectHelmChartRepository = convertToProjectHelmChartRepository(
        sampleProjectHelmChartRepositoryFormData,
        'test-ns',
      );
      expect(sampleProjectHelmChartRepository).toMatchObject(newProjectHelmChartRepository);
    });
  });
  describe('getDefaultResource', () => {
    it('should get default resource', () => {
      const defaultResource = getDefaultResource('test-ns');
      expect(defaultResource).toEqual(defaultProjectHelmChartRepository);
    });
  });
});
