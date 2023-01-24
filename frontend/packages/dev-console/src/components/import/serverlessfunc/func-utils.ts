import { BuilderImage, NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { SupportedRuntime } from '../import-types';

export const getRuntimeImage = (
  runtime: SupportedRuntime,
  builderImages: NormalizedBuilderImages,
): BuilderImage => {
  switch (runtime) {
    case SupportedRuntime.Node:
      return builderImages.nodejs;
    case SupportedRuntime.NodeJS:
      return builderImages.nodejs;
    case SupportedRuntime.TypeScript:
      return builderImages.nodejs;
    case SupportedRuntime.Quarkus:
      return builderImages.java;
    default:
      return undefined;
  }
};
