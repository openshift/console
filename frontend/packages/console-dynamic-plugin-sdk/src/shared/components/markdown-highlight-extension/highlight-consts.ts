export const LINK_LABEL = '[\\d\\w\\s-()$!]+';
export const HIGHLIGHT_ACTIONS = ['highlight'];
export const SELECTOR_ID = `[\\w-]+`;

// [linkLabel]{{action id}}
export const HIGHLIGHT_REGEXP = new RegExp(
  `\\[(${LINK_LABEL})]{{(${HIGHLIGHT_ACTIONS.join('|')}) (${SELECTOR_ID})}}`,
  'g',
);
