import type { OxlintConfig } from 'oxlint';

// airbnb react + jsx-a11y defaults (eslint-config-airbnb@19.0.4, excluding
// the airbnb-base rules that live in airbnb-base.ts), materialized so that
// every rule is explicit and runs under oxlint. Rules without a native
// oxlint implementation run via the aliased react-js plugin. The console's
// tweaks live in react.ts.
export default {
  'react/display-name': [
    'off',
    {
      ignoreTranspilerName: false,
    },
  ],
  'react/forbid-dom-props': [
    'off',
    {
      forbid: [],
    },
  ],
  'react/jsx-boolean-value': [
    'error',
    'never',
    {
      always: [],
    },
  ],
  'react/jsx-handler-names': [
    'off',
    {
      eventHandlerPrefix: 'handle',
      eventHandlerPropPrefix: 'on',
    },
  ],
  'react/jsx-key': 'off',
  'react-js/jsx-no-bind': [
    'error',
    {
      ignoreRefs: true,
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false,
      ignoreDOMComponents: true,
    },
  ],
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-no-literals': [
    'off',
    {
      noStrings: true,
    },
  ],
  'react/jsx-no-undef': 'error',
  'react/jsx-pascal-case': [
    'error',
    {
      allowAllCaps: true,
      ignore: [],
    },
  ],
  'react-js/jsx-uses-react': ['error'],
  'react-js/jsx-uses-vars': 'error',
  'react/no-danger': 'warn',
  'react-js/no-deprecated': ['error'],
  'react/no-did-mount-set-state': 'off',
  'react/no-did-update-set-state': 'error',
  'react/no-will-update-set-state': 'error',
  'react/no-direct-mutation-state': 'off',
  'react/no-is-mounted': 'error',
  'react/no-multi-comp': 'off',
  'react/no-set-state': 'off',
  'react/no-string-refs': 'error',
  'react/no-unknown-property': 'error',
  'react/prefer-es6-class': ['error', 'always'],
  'react-js/prefer-stateless-function': [
    'error',
    {
      ignorePureComponents: true,
    },
  ],
  'react/react-in-jsx-scope': 'error',
  'react/require-render-return': 'error',
  'react/self-closing-comp': 'error',
  'react/jsx-no-target-blank': [
    'error',
    {
      enforceDynamicLinks: 'always',
    },
  ],
  'react/jsx-filename-extension': [
    'error',
    {
      extensions: ['.jsx'],
    },
  ],
  'react/jsx-no-comment-textnodes': 'error',
  'react/no-render-return-value': 'error',
  'react/no-find-dom-node': 'error',
  'react/forbid-component-props': [
    'off',
    {
      forbid: [],
    },
  ],
  'react/forbid-elements': [
    'off',
    {
      forbid: [],
    },
  ],
  'react/no-danger-with-children': 'error',
  'react/style-prop-object': 'error',
  'react/no-unescaped-entities': 'error',
  'react/no-children-prop': 'error',
  'react/no-array-index-key': 'error',
  'react-js/forbid-foreign-prop-types': [
    'warn',
    {
      allowInPropTypes: true,
    },
  ],
  'react/void-dom-elements-no-children': 'error',
  'react/no-redundant-should-component-update': 'error',
  'react-js/no-unused-state': 'error',
  'react-js/no-typos': 'error',
  'react/jsx-curly-brace-presence': [
    'error',
    {
      props: 'never',
      children: 'never',
    },
  ],
  'react-js/no-access-state-in-setstate': 'error',
  'react/button-has-type': [
    'error',
    {
      button: true,
      submit: true,
      reset: false,
    },
  ],
  'react/no-this-in-sfc': 'error',
  'react/jsx-max-depth': 'off',
  'react/no-unsafe': 'off',
  'react/jsx-fragments': ['error', 'syntax'],
  'react/state-in-constructor': ['error', 'always'],
  'react-js/static-property-placement': ['error', 'property assignment'],
  'react/jsx-props-no-spreading': [
    'error',
    {
      html: 'enforce',
      custom: 'enforce',
      explicitSpread: 'ignore',
      exceptions: [],
    },
  ],
  'react/jsx-no-script-url': [
    'error',
    [
      {
        name: 'Link',
        props: ['to'],
      },
    ],
  ],
  'react/jsx-no-useless-fragment': 'error',
  'react/function-component-definition': [
    'error',
    {
      namedComponents: ['function-declaration', 'function-expression'],
      unnamedComponents: 'function-expression',
    },
  ],
  'react/jsx-no-constructed-context-values': 'error',
  'react/no-unstable-nested-components': 'error',
  'react/no-namespace': 'error',
  'react-js/prefer-exact-props': 'error',
  'react-js/no-arrow-function-lifecycle': 'error',
  'react-js/no-invalid-html-attribute': 'error',
  'react-js/no-unused-class-component-methods': 'error',
  'jsx-a11y/alt-text': [
    'error',
    {
      elements: ['img', 'object', 'area', 'input[type="image"]'],
      img: [],
      object: [],
      area: [],
      'input[type="image"]': [],
    },
  ],
  'jsx-a11y/anchor-has-content': [
    'error',
    {
      components: [],
    },
  ],
  'jsx-a11y/anchor-is-valid': [
    'error',
    {
      components: ['Link'],
      specialLink: ['to'],
      aspects: ['noHref', 'invalidHref', 'preferButton'],
    },
  ],
  'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/aria-role': [
    'error',
    {
      ignoreNonDOM: false,
    },
  ],
  'jsx-a11y/aria-unsupported-elements': 'error',
  'jsx-a11y/autocomplete-valid': [
    'off',
    {
      inputComponents: [],
    },
  ],
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/control-has-associated-label': [
    'error',
    {
      labelAttributes: ['label'],
      controlComponents: [],
      ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
      ignoreRoles: [
        'grid',
        'listbox',
        'menu',
        'menubar',
        'radiogroup',
        'row',
        'tablist',
        'toolbar',
        'tree',
        'treegrid',
      ],
      depth: 5,
    },
  ],
  'jsx-a11y/heading-has-content': [
    'error',
    {
      components: [''],
    },
  ],
  'jsx-a11y/html-has-lang': 'error',
  'jsx-a11y/iframe-has-title': 'error',
  'jsx-a11y/img-redundant-alt': 'error',
  'jsx-a11y/interactive-supports-focus': 'error',
  'jsx-a11y/label-has-associated-control': [
    'error',
    {
      labelComponents: [],
      labelAttributes: [],
      controlComponents: [],
      assert: 'both',
      depth: 25,
    },
  ],
  'jsx-a11y/lang': 'error',
  'jsx-a11y/media-has-caption': [
    'error',
    {
      audio: [],
      video: [],
      track: [],
    },
  ],
  'jsx-a11y/mouse-events-have-key-events': 'error',
  'jsx-a11y/no-access-key': 'error',
  'jsx-a11y/no-autofocus': [
    'error',
    {
      ignoreNonDOM: true,
    },
  ],
  'jsx-a11y/no-distracting-elements': [
    'error',
    {
      elements: ['marquee', 'blink'],
    },
  ],
  'jsx-a11y/no-interactive-element-to-noninteractive-role': [
    'error',
    {
      tr: ['none', 'presentation'],
    },
  ],
  'jsx-a11y/no-noninteractive-element-interactions': [
    'error',
    {
      handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
    },
  ],
  'jsx-a11y/no-noninteractive-element-to-interactive-role': [
    'error',
    {
      ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
      ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
      li: ['menuitem', 'option', 'row', 'tab', 'treeitem'],
      table: ['grid'],
      td: ['gridcell'],
    },
  ],
  'jsx-a11y/no-noninteractive-tabindex': [
    'error',
    {
      tags: [],
      roles: ['tabpanel'],
    },
  ],
  'jsx-a11y/no-redundant-roles': 'error',
  'jsx-a11y/no-static-element-interactions': [
    'error',
    {
      handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
    },
  ],
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/role-supports-aria-props': 'error',
  'jsx-a11y/scope': 'error',
  'jsx-a11y/tabindex-no-positive': 'error',
} satisfies OxlintConfig['rules'];
