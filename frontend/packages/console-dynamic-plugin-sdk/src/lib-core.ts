/**
 * @file Entrypoint for the `@openshift-console/dynamic-plugin-sdk` package published to npmjs.
 *
 * Provides core APIs, types and utilities used by dynamic plugins at runtime.
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference, spaced-comment
/// <reference path="../../../@types/console/index.d.ts" />

export * from './extensions';
export * from './api/core-api';
