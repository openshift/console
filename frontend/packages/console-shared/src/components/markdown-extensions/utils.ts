export const removeTemplateWhitespace = (template: string): string => {
  return template.replace(/>(?:\s|\n)+</g, '><');
};
