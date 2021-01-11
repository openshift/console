import { mergeData } from '../resource-label-utils';
import {
  devfileDeployment,
  newBuildConfig,
  newDeployment,
  newDeploymentConfig,
  originalBuildConfig,
  originalDeployment,
  originalDeploymentConfig,
} from './resource-label-utils-data';

describe('resource-label-utils', () => {
  describe('mergeData', () => {
    it('should return newResource when originalResource is empty', () => {
      const mergedResource = mergeData({}, newDeployment);
      expect(mergedResource).toEqual(newDeployment);
    });

    it('should return mergedData with newResource labels', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.metadata.labels).toEqual(newDeployment.metadata.labels);
    });

    it('should return mergedData with newResource and originalResource labels if originalResource is a devfile resource', () => {
      const mergedResource = mergeData(devfileDeployment, newDeployment);
      expect(mergedResource.metadata.labels).toEqual({
        ...newDeployment.metadata.labels,
        ...devfileDeployment.metadata.labels,
      });
    });

    it('should return mergedData with newResource annotations ', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.metadata.annotations).toEqual(newDeployment.metadata.annotations);
    });

    it('should return mergedData with newResource and originalResource annotations if originalResource is a devfile resource', () => {
      const mergedResource = mergeData(devfileDeployment, newDeployment);
      expect(mergedResource.metadata.annotations).toEqual({
        ...newDeployment.metadata.annotations,
        ...devfileDeployment.metadata.annotations,
      });
    });

    it('should return mergedData with newResource template labels', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.template.metadata.labels).toEqual(
        newDeployment.spec.template.metadata.labels,
      );
    });

    it('should return mergedData with newResource template containers', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.template.spec.containers).toEqual(
        newDeployment.spec.template.spec.containers,
      );
    });

    it('should return mergedData with newResource strategy', () => {
      const mergedResource = mergeData(originalBuildConfig, newBuildConfig);
      expect(mergedResource.spec.strategy).toEqual(newBuildConfig.spec.strategy);
    });

    it('should return mergedData with originalResource strategy if newResource strategy is undefined', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.strategy).toEqual(originalDeployment.spec.strategy);
    });

    it('should return mergedData with newResource triggers', () => {
      const mergedResource = mergeData(originalDeploymentConfig, newDeploymentConfig);
      expect(mergedResource.spec.triggers).toEqual(newDeploymentConfig.spec.triggers);
    });

    it('should return mergedData with originalResource template volumes and volumeMounts ', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.template.spec.volumes).toEqual(
        originalDeployment.spec.template.spec.volumes,
      );
      expect(mergedResource.spec.template.spec.containers[0].volumeMounts).toEqual(
        originalDeployment.spec.template.spec.containers[0].volumeMounts,
      );
    });
  });
});
