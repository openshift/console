import { getResources, augmentRunsToData } from '../pipeline-augment';
import { testData } from './pipeline-augment-test-data';

describe('PipelineAugment test getResources create correct resources for firehose', () => {
  it('expect resources to be null for no data', () => {
    const resources = getResources(testData[0].data);
    expect(resources.resources).toBe(null);
    expect(resources.propsReferenceForRuns).toBe(null);
  });

  it('expect resources to be null for empty data array', () => {
    const resources = getResources(testData[1].data);
    expect(resources.resources).toBe(null);
    expect(resources.propsReferenceForRuns).toBe(null);
  });

  it('expect resources to be of length 1 and have the following properties & childprops', () => {
    const resources = getResources(testData[2].data);
    expect(resources.resources.length).toBe(1);
    expect(resources.resources[0].kind).toBe('PipelineRun');
    expect(resources.resources[0].namespace).toBe(testData[2].data[0].metadata.namespace);
    expect(resources.propsReferenceForRuns.length).toBe(1);
  });

  it('expect resources to be of length 2 and have the following properties & childprops', () => {
    const resources = getResources(testData[3].data);
    expect(resources.resources.length).toBe(2);
    expect(resources.resources[0].kind).toBe('PipelineRun');
    expect(resources.resources[1].kind).toBe('PipelineRun');
    expect(resources.resources[0].namespace).toBe(testData[3].data[0].metadata.namespace);
    expect(resources.resources[0].namespace).toBe(testData[3].data[1].metadata.namespace);
    expect(resources.propsReferenceForRuns.length).toBe(2);
  });
});

describe('PipelineAugment test correct data is augmented', () => {
  it('expect additional resources to be correctly added using augmentRunsToData', () => {
    const newData = augmentRunsToData(
      testData[2].data,
      testData[2].propsReferenceForRuns,
      testData[2].keyedRuns,
    );
    expect(newData.length).toBe(1);
    expect(newData[0].latestRun.metadata.name).toBe(
      testData[2].keyedRuns.apple1Runs.data[0].metadata.name,
    );
  });

  it('expect additional resources to be added using latest run', () => {
    const newData = augmentRunsToData(
      testData[3].data,
      testData[3].propsReferenceForRuns,
      testData[3].keyedRuns,
    );
    expect(newData.length).toBe(2);
    expect(newData[0].latestRun.metadata.name).toBe(
      testData[3].keyedRuns.apple1Runs.data[1].metadata.name,
    );
    expect(newData[1].latestRun.metadata.name).toBe(
      testData[3].keyedRuns.apple2Runs.data[0].metadata.name,
    );
  });
});
