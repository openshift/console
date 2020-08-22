import './login';
import './project';
import './selectors';
import './nav';
import './resources';
import 'cypress-jest-adapter';

Cypress.Cookies.defaults({
  preserve: ['openshift-session-token', 'csrf-token'],
});

export const checkErrors = () =>
  cy.window().then((win) => {
    if (win.windowError) {
      throw new Error(`window/js runtime error detected: ${win.windowError}`);
    }
  });

export const testName = `test-${Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5)}`;

export const actions = Object.freeze({
  labels: 'Edit Labels',
  annotations: 'Edit Annotations',
  edit: 'Edit',
  delete: 'Delete',
});

const actionOnKind = (action: string, kind: string) => {
  const humanizedKind = (kind.includes('~') ? kind.split('~')[2] : kind)
    .split(/(?=[A-Z])/)
    .join(' ');

  return `${action} ${humanizedKind}`;
};
export const editHumanizedKind = (kind: string) => actionOnKind(actions.edit, kind);
export const deleteHumanizedKind = (kind: string) => actionOnKind(actions.delete, kind);
