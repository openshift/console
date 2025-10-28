import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../../models';
import { HelmChartRepositoryType } from '../../../../types/helm-types';
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
  it('should include basicAuthConfig only for ProjectHelmChartRepository', () => {
    // Test ProjectHelmChartRepository includes basicAuthConfig
    const projectFormData = _.cloneDeep(sampleHelmChartRepositoryFormData);
    projectFormData.scope = 'ProjectHelmChartRepository';
    projectFormData.basicAuthConfig = 'test-basic-auth-secret';
    const projectRepo = convertToHelmChartRepository(projectFormData, 'test-ns');
    expect(projectRepo.spec.connectionConfig.basicAuthConfig).toEqual({
      name: 'test-basic-auth-secret',
    });

    // Test cluster-scoped HelmChartRepository excludes basicAuthConfig
    const clusterFormData = _.cloneDeep(sampleHelmChartRepositoryFormData);
    clusterFormData.scope = 'HelmChartRepository';
    clusterFormData.basicAuthConfig = 'test-basic-auth-secret';
    const clusterRepo = convertToHelmChartRepository(clusterFormData, 'test-ns');
    expect(clusterRepo.spec.connectionConfig.basicAuthConfig).toBeUndefined();
  });
  it('should convert form data with basicAuthConfig correctly', () => {
    const repoWithBasicAuth: HelmChartRepositoryType = {
      ...sampleProjectHelmChartRepository,
      spec: {
        ...sampleProjectHelmChartRepository.spec,
        connectionConfig: {
          ...sampleProjectHelmChartRepository.spec.connectionConfig,
          basicAuthConfig: { name: 'my-basic-auth' },
        },
      },
    };
    const form = convertToForm(repoWithBasicAuth);
    expect(form.basicAuthConfig).toEqual('my-basic-auth');
  });
});
