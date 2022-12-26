import {
  BuilderImage,
  NormalizedBuilderImages,
} from '@console/dev-console/src/utils/imagestream-utils';

export const enum Runtime {
  Node = 'node',
  Python = 'python',
}

export const getRuntimeImage = (
  runtime: Runtime,
  builderImages: NormalizedBuilderImages,
): BuilderImage => {
  switch (runtime) {
    case Runtime.Node:
      return builderImages.nodejs;
    case Runtime.Python:
      return builderImages.python;
    default:
      return undefined;
  }
};
