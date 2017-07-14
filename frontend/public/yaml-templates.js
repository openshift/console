export const TEMPLATES = {};

export const registerTemplate = (kindString, template) => {
  if (TEMPLATES[kindString]) {
    throw new Error(`${kindString} has already been registered`);
  }
  TEMPLATES[kindString] = template;
};
