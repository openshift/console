import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../../models';
import {
  convertToForm,
  convertToHelmChartRepository,
  getDefaultResource,
} from '../helmchartrepository-create-utils';
import {
  defaultProjectHelmChartRepository,
  sampleProjectHelmChartRepository,
  sampleHelmChartRepositoryFormData,
} from './helmchartrepository-data';

describe('HelmChartRepository create utils', () => {
  it('should convert to form data', () => {
    const form = convertToForm(sampleProjectHelmChartRepository);
    expect(form).toEqual(sampleHelmChartRepositoryFormData);
  });
  it('should convert to helm chart repository resource based on scope', () => {
    let newHelmChartRepository = convertToHelmChartRepository(
      sampleHelmChartRepositoryFormData,
      'test-ns',
    );
    expect(sampleProjectHelmChartRepository).toMatchObject(newHelmChartRepository);

    const sampleFormData = _.cloneDeep(sampleHelmChartRepositoryFormData);
    sampleFormData.scope = 'HelmChartRepository';
    newHelmChartRepository = convertToHelmChartRepository(sampleFormData, 'test-ns');
    const sampleHelmChartRepository = _.cloneDeep(sampleProjectHelmChartRepository);
    sampleHelmChartRepository.kind = 'HelmChartRepository';
    expect(sampleHelmChartRepository).toMatchObject(newHelmChartRepository);
  });
  it('should get default resource based on kind', () => {
    let defaultResource = getDefaultResource(
      'test-ns',
      referenceForModel(ProjectHelmChartRepositoryModel),
    );
    expect(defaultResource).toEqual(defaultProjectHelmChartRepository);

    const defaultHCR = _.cloneDeep(defaultProjectHelmChartRepository);
    defaultHCR.kind = 'HelmChartRepository';
    delete defaultHCR.metadata.namespace;
    defaultResource = getDefaultResource('test-ns', referenceForModel(HelmChartRepositoryModel));
    expect(defaultResource).toEqual(defaultHCR);
  });
});
