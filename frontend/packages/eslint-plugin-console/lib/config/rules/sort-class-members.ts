// see https://github.com/bryanrsmith/eslint-plugin-sort-class-members

module.exports = {
  'sort-class-members/sort-class-members': [
    'error',
    {
      order: [
        '[static-properties]',
        '[static-methods]',
        '[properties]',
        '[conventional-private-properties]',
        'function Object() { [native code] }',
        '[methods]',
        '[conventional-private-methods]',
        '[everything-else]',
      ],
      accessorPairPositioning: 'getThenSet',
    },
  ],
};
