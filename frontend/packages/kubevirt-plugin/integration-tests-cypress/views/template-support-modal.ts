export const closeTemplateSupportModal = () => {
  const modalTitle = '[data-test-id="modal-title"]';
  const confirmButton = '#confirm-action';

  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(confirmButton).click();
    }
  });
};
