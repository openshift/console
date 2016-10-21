// Selects all of the event target's text
export const selectText = (e) => {
  e.currentTarget.select();
  e.preventDefault();
  e.stopPropagation();
};
