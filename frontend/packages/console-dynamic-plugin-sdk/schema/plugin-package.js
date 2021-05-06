export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description:
        'Plugin name. Should be the same as `metadata.name` of the corresponding `ConsolePlugin` resource used to represent the plugin on the cluster.',
    },
    version: {
      type: 'string',
      description: 'Plugin version. Must be semver compliant.',
    },
    displayName: {
      type: 'string',
      description: 'User-friendly plugin name.',
    },
    description: {
      type: 'string',
      description: 'User-friendly plugin description.',
    },
    exposedModules: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
      description: "Specific modules exposed through the plugin's remote entry.",
    },
    dependencies: {
      type: 'object',
      properties: {
        '@console/pluginAPI': {
          type: 'string',
        },
      },
      required: ['@console/pluginAPI'],
      additionalProperties: {
        type: 'string',
      },
      description: 'Plugin API and other plugins required for this plugin to work.',
    },
  },
  required: ['name', 'version', 'dependencies'],
  additionalProperties: false,
  description: 'Console plugin metadata in `package.json` file.',
  definitions: {},
};
