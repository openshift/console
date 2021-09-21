const defaultState = {
  working: false,
};

export const demoReducer = (state = defaultState, action) => {
  // eslint-disable-next-line no-console
  console.debug('demoReducer', state, action.type, action);

  return state;
};
