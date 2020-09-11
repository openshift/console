export const navigation = {
  items: {
    shouldBeLoaded: () => {
      cy.get('.pf-c-nav__list').should('be.visible');
    },
    shouldExist: (resourceName: string) =>
      cy.get('.pf-c-nav__item.pf-c-nav__link').contains(resourceName),
  },
};
