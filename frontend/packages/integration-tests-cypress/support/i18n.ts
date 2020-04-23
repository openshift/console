import { expect } from 'chai';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      isPseudoLocalized(): Chainable<Element>;
    }
  }
}

Cypress.Commands.add(
  'isPseudoLocalized',
  {
    prevSubject: true,
  },
  (subject) => {
    const text = subject.text();
    expect(text).to.match(/\[[^a-zA-Z]+\]/);
  },
);
