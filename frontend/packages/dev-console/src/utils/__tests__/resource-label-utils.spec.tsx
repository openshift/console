import { getTriggerAnnotation, mergeData } from '../resource-label-utils';
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

    it('should return mergedData with default and user annotations with correct values', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.metadata.annotations).toEqual({
        'alpha.image.policy.openshift.io/resolve-names': '*',
        'app.openshift.io/vcs-ref': 'master',
        'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
        'image.openshift.io/triggers':
          '[{"from":{"kind":"ImageStreamTag","name":"nationalparks-py:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"nationalparks-py\\")].image","pause":"true"}]',
        'openshift.io/generated-by': 'OpenShiftWebConsole',
        'app.openshift.io/connects-to': 'database',
        'deployment.kubernetes.io/revision': '4',
      });
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

    it('should return mergedData with newResource template container values', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.template.spec.containers).toEqual([
        {
          name: 'nationalparks-py',
          image:
            'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:8b187a8f235f42e7ea3e21e740c4940fdfa3ec8b59a14bb1cd9a67ffedf2eef9',
          ports: [
            {
              containerPort: 8080,
              protocol: 'TCP',
            },
          ],
          env: [
            {
              name: 'dev',
              value: 'test',
            },
          ],
          envFrom: [
            {
              configMapRef: {
                name: 'testconfig',
              },
            },
          ],
          volumeMounts: [
            {
              name: 'test-volume',
              mountPath: '/test',
            },
          ],
          resources: {},
          terminationMessagePath: '/dev/termination-log',
          terminationMessagePolicy: 'File',
          imagePullPolicy: 'Always',
        },
      ]);
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

    it('should return mergedData with originalResource template volumes', () => {
      const mergedResource = mergeData(originalDeployment, newDeployment);
      expect(mergedResource.spec.template.spec.volumes).toEqual(
        originalDeployment.spec.template.spec.volumes,
      );
    });
  });
  describe('getTriggerAnnotation', () => {
    it('should return trigger annotation with proper values', () => {
      let annotation = getTriggerAnnotation('test', 'python', 'div', true);
      expect(annotation).toEqual({
        'image.openshift.io/triggers':
          '[{"from":{"kind":"ImageStreamTag","name":"python:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"test\\")].image","pause":"false"}]',
      });
      annotation = getTriggerAnnotation('test', 'test', 'div', false);
      expect(annotation).toEqual({
        'image.openshift.io/triggers':
          '[{"from":{"kind":"ImageStreamTag","name":"test:latest","namespace":"div"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"test\\")].image","pause":"true"}]',
      });
    });
  });
});
