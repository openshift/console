/**
 * @file Entrypoint for the `@openshift-console/dynamic-plugin-sdk-webpack` package published to npmjs.
 *
 * Provides webpack plugin `ConsoleRemotePlugin` used to build all Console dynamic plugin assets.
 */

export { ConsoleRemotePlugin, ConsoleRemotePluginOptions } from './webpack/ConsoleRemotePlugin';
export { ConsolePluginBuildMetadata } from './build-types';
