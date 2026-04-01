export const masthead = {
  username: {
    shouldBeVisible: () =>
      cy
        .env(['BRIDGE_KUBEADMIN_PASSWORD'])
        .then(({ BRIDGE_KUBEADMIN_PASSWORD }) =>
          cy
            .byTestID(BRIDGE_KUBEADMIN_PASSWORD ? 'user-dropdown-toggle' : 'username')
            .should('be.visible'),
        ),
    shouldHaveText: (text: string) =>
      cy
        .env(['BRIDGE_KUBEADMIN_PASSWORD'])
        .then(({ BRIDGE_KUBEADMIN_PASSWORD }) =>
          cy
            .byTestID(BRIDGE_KUBEADMIN_PASSWORD ? 'user-dropdown-toggle' : 'username')
            .should('have.text', text),
        ),
  },
  userDropdown: () => cy.byTestID('user-dropdown-toggle'),
  quickCreateDropdown: () => cy.byTestID('quick-create-dropdown'),
  copyLoginCommand: () => cy.byTestID('copy-login-command').find('a'),
  clickMastheadLink: (path: string) => {
    return cy.byTestID(path).click();
  },
};
