export const keycloakRegistrationPage = {
  submitRegistrationForm: (
    username: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    cy.get('#kc-update-profile-form').within(() => {
      cy.get('#username').type(username);
      cy.get('#email').type(email);
      cy.get('#firstName').type(firstName);
      cy.get('#lastName').type(lastName);
      cy.get('.btn').click();
    });
  },
};
