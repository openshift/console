export const pacPage = {
  enterSecret: (secret: string) => {
    cy.get('#form-input-pac-repository-webhook-token-field')
      .clear()
      .type(secret);
  },
  clickGenerateWebhookSecret: () => {
    cy.byButtonText('Generate').click();
  },
};
