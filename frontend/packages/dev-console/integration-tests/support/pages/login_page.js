class loginPage {
  static visitLoginPage() {
    cy.visit('/');
    cy.get('a[title="Log in with kube:admin"]').click();
    cy.url().should('include', 'login');
  }

  static fillUsername(username) {
    cy.get('#inputUsername').type(username);
  }

  static fillPassword(password) {
    cy.get('#inputPassword').type(password);
  }

  static submitLoginDetails() {
    cy.get('[type="submit"]').click();
  }

  static checkLoginSuccess() {
    cy.get('[aria-label="Help menu"]').should('be.visible');
  }

  static checkErrorMessage(errorMessage) {
    cy.get('div.error-placeholder').should('contain.text', errorMessage);
  }
}

export default loginPage;
