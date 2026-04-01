export const catalog = {
  filterByKeyword: (keyword: string) => {
    cy.get(`input[placeholder*="Filter by keyword"]`).clear().type(`${keyword}`);
  },
  checkItemImage: (srcText) => {
    cy.get('img.catalog-item-header-pf-icon')
      .should('have.attr', 'src')
      .and('contain', `${srcText}`);
  },
};
