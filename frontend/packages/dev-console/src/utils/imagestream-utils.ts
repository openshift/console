import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as semver from 'semver';
import {
  getImageStreamIcon,
  getImageForIconClass,
} from '@console/internal/components/catalog/catalog-item-icon';
import {
  isBuilder,
  getMostRecentBuilderTag,
  getBuilderTagsSortedByVersion,
} from '@console/internal/components/image-stream';
import { FirehoseResource } from '@console/internal/components/utils';
import { ProjectModel, ImageStreamModel } from '@console/internal/models';
import {
  ContainerPort,
  K8sResourceKind,
  K8sResourceCommon,
  ObjectMetadata,
} from '@console/internal/module/k8s';

export interface ImageTag {
  name: string;
  annotations: {
    [key: string]: string;
  };
  generation: number;
  [key: string]: any;
}
export interface BuilderImage {
  obj: K8sResourceKind;
  name: string;
  displayName: string;
  description: string;
  title: string;
  iconUrl: string;
  tags: ImageTag[];
  recentTag: ImageTag;
  imageStreamNamespace: string;
}

export interface NormalizedBuilderImages {
  [builderImageName: string]: BuilderImage;
}

export const imageStreamLabels = ['app.kubernetes.io/name', 'app.openshift.io/runtime'];

export const getSampleRepo = (tag) => tag?.annotations?.sampleRepo ?? '';
export const getSampleRef = (tag) => tag?.annotations?.sampleRef ?? '';
export const getSampleContextDir = (tag) => tag?.annotations?.sampleContextDir ?? '';

// Transform image ports to k8s structure.
// `{ '3306/tcp': {} }` -> `{ containerPort: 3306, protocol: 'TCP' }`
const portsFromSpec = (portSpec: object): ContainerPort[] => {
  return _.reduce(
    portSpec,
    (result: ContainerPort[], value, key) => {
      const parts = key.split('/');
      if (parts.length === 1) {
        parts.push('tcp');
      }

      const containerPort = parseInt(parts[0], 10);
      if (_.isFinite(containerPort)) {
        result.push({
          containerPort,
          protocol: parts[1].toUpperCase(),
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('Unrecognized image port format', key);
      }

      return result;
    },
    [],
  );
};

export const getPorts = (imageStreamImage): ContainerPort[] => {
  const portSpec =
    imageStreamImage?.image?.dockerImageMetadata?.Config?.ExposedPorts ||
    imageStreamImage?.image?.dockerImageMetadata?.ContainerConfig?.ExposedPorts;
  return portsFromSpec(portSpec);
};

// Use the same naming convention as the CLI.
export const makePortName = (port: ContainerPort): string =>
  `${port.containerPort}-${port.protocol}`.toLowerCase();

export const prettifyName = (name: string) => {
  return name.replace(/(-|^)([^-]?)/g, (first, prep, letter) => {
    return (prep && ' ') + letter.toUpperCase();
  });
};

export const normalizeBuilderImages = (
  imageStreams: K8sResourceCommon | K8sResourceCommon[],
): NormalizedBuilderImages => {
  const data = Array.isArray(imageStreams) ? imageStreams : [imageStreams];
  const builderImageStreams = data.filter((imageStream) => isBuilder(imageStream));

  return builderImageStreams.reduce((builderImages: NormalizedBuilderImages, imageStream) => {
    const tags = getBuilderTagsSortedByVersion(imageStream);
    const recentTag = getMostRecentBuilderTag(imageStream);
    const { name } = imageStream.metadata as ObjectMetadata;
    const displayName = imageStream?.metadata?.annotations?.['openshift.io/display-name'];
    const description = recentTag?.annotations?.description;
    const imageStreamNamespace = imageStream.metadata?.namespace;
    const title =
      displayName && displayName.length < 14 ? displayName : prettifyName(name as string);
    const iconClass = getImageStreamIcon(recentTag);
    const iconUrl = getImageForIconClass(iconClass);

    builderImages[name as string] = {
      obj: imageStream,
      name: name as string,
      displayName: displayName ?? '',
      description,
      title,
      iconUrl,
      tags,
      recentTag,
      imageStreamNamespace: imageStreamNamespace as string,
    };
    return builderImages;
  }, {});
};

export const getTagDataWithDisplayName = (
  imageTags: ImageTag[],
  selectedTag: string,
  defaultName: string,
): [ImageTag, string] => {
  const imageTag = _.find(imageTags, { name: selectedTag });
  const displayName = imageTag?.annotations?.['openshift.io/display-name'] ?? defaultName;

  return [imageTag as ImageTag, displayName];
};

export const getSuggestedName = (name: string): string | undefined => {
  if (!name) {
    return undefined;
  }
  const imageName: string = _.last(name.split('/')) as string;
  return _.first(imageName.split(/[^a-z0-9-]/));
};

export enum RegistryType {
  External = 'external',
  Internal = 'internal',
}
export enum BuilderImagesNamespace {
  Openshift = 'openshift',
}
export const imageRegistryType = (t: TFunction) => {
  return {
    External: {
      value: RegistryType.External,
      label: t('devconsole~Image name from external registry'),
    },
    Internal: {
      value: RegistryType.Internal,
      label: t('devconsole~Image stream tag from internal registry'),
    },
  };
};

export const getSortedTags = (imageStream: K8sResourceKind) => {
  return _.isArray(imageStream.status?.tags) && imageStream.status?.tags.length
    ? imageStream.status?.tags.sort(({ tag: a }, { tag: b }) => {
        const v1 = semver.coerce(a);
        const v2 = semver.coerce(b);
        if (!v1 && !v2) {
          return a.localeCompare(b);
        }
        if (!v1) {
          return 1;
        }
        if (!v2) {
          return -1;
        }
        return semver.rcompare(v1, v2);
      })
    : [];
};
export const getImageStreamTags = (imageStream: K8sResourceKind) => {
  const sortedTags = imageStream && !_.isEmpty(imageStream) ? getSortedTags(imageStream) : [];
  return sortedTags.reduce((tags, { tag }) => {
    tags[tag] = tag;
    return tags;
  }, {});
};

export const getProjectResource = (): FirehoseResource[] => {
  return [
    {
      isList: true,
      kind: ProjectModel.kind,
      prop: ProjectModel.id as string,
    },
  ];
};

export const getImageStreamResource = (namespace: string): FirehoseResource[] => {
  const resource: FirehoseResource[] = [];
  if (namespace) {
    resource.push({
      isList: true,
      kind: ImageStreamModel.kind,
      prop: ImageStreamModel.id as string,
      namespace,
    });
  }
  return resource;
};
