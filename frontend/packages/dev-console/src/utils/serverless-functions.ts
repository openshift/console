import { BuilderImage, NormalizedBuilderImages } from './imagestream-utils';

export enum SupportedRuntime {
  Node = 'node',
  NodeJS = 'nodejs',
  TypeScript = 'typescript',
  Quarkus = 'quarkus',
}

export const notSupportedRuntime = ['go', 'rust', 'springboot', 'python'];

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
