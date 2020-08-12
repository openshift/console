export const loginPage = {
  visitLoginPage: () => {
    cy.visit('/');
    cy.url().should('include', 'login');
  },
  fillUsername: (username: string) => cy.get('#inputUsername').type(username),
  fillPassword: (password: string) => cy.get('#inputPassword').type(password),
  submitLoginDetails: () => cy.get('[type="submit"]').click(),
  checkLoginSuccess: () => cy.get('[aria-label="Help menu"]').should('be.visible'),
  checkErrorMessage: (errorMessage: string) =>
    cy.get('div.error-placeholder').should('contain.text', errorMessage),

  loginWithValidCredentials: (username: string, password: string) => {
    cy.visit('/');
    cy.get('body').then(($body) => {
      if ($body.find('a[title="Log in with kube:admin"]').length) {
        cy.get('a[title="Log in with kube:admin"]').click()
        // .then(() => {
          cy.url().should('include', 'login');
        // })
      }
    })
    cy.get('#inputUsername').type(username);
    cy.get('#inputPassword').type(password);
    cy.get('[type="submit"]').click();
  },
};
