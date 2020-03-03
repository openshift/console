import * as k8sModels from '@console/internal/module/k8s';
import { ServiceModel, PodModel } from '@console/internal/models';
import { mockPod } from '@console/shared/src/utils/__mocks__/pod-utils-test-data';
import { getKebabActionsForKind } from '../kebab-actions';
import { ImageManifestVulnModel } from '../models';

describe('getKebabActionsForKind', () => {
  const pod: k8sModels.K8sResourceKind = {
    ...mockPod,
    status: {
      phase: 'Running',
      containerStatuses: [
        {
          name: 'mock-container',
          ready: true,
          restartCount: 0,
          imageID:
            'docker-pullable://quay.io/example/example@sha256:73d60e4f2adbc70ed8df93245fb2d83c9e0062489a22110d897b83c21918e101',
          image:
            'quay.io/example/example@sha256:73d60e4f2adbc70ed8df93245fb2d83c9e0062489a22110d897b83c21918e101',
          containerID: 'docker://410fa79084b1ae605b6483bb21f6d4459f90c54ad1d55f56a05fb0b654acfd44',
        },
      ],
    },
  };

  it('returns `ViewImageVulnerabilities` kebab action if given `PodModel`', () => {
    spyOn(k8sModels, 'modelFor').and.returnValue(PodModel);
    const actions = getKebabActionsForKind(PodModel);

    expect(actions.length).toEqual(1);
    expect(actions[0](PodModel, pod).label).toEqual('View Image Vulnerabilities');
    expect(actions[0](PodModel, pod).href).toEqual(
      '/k8s/ns/testproject3/secscan.quay.redhat.com~v1alpha1~ImageManifestVuln/?name=sha256.73d60e4f2adbc70ed8df93245fb2d83c9e0062489a22110d897b83c21918e101',
    );
    expect(actions[0](PodModel, pod).accessReview).toEqual({
      group: ImageManifestVulnModel.apiGroup,
      resource: ImageManifestVulnModel.plural,
      namespace: pod.metadata.namespace,
      verb: 'list',
    });
  });

  it('returns no actions if not given `PodModel`', () => {
    spyOn(k8sModels, 'modelFor').and.returnValue(ServiceModel);
    expect(getKebabActionsForKind(ServiceModel).length).toEqual(0);
  });
});
