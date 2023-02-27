import { samplesPO } from '../../pageObjects/add-flow-po';

export const samplesPage = {
  search: (keyword: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.get(samplesPO.search)
      .clear()
      .type(keyword);
  },
  selectCardInSamples: (card: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (card) {
      case 'Httpd': {
        // There should be no communication to the GitHub API in this case!
        cy.intercept('https://api.github.com/**', { statusCode: 503 });
        cy.get(samplesPO.cards.httpdTemplate)
          .first()
          .click();
        break;
      }
      case 'Basic Go': {
        cy.intercept('https://api.github.com/**', async (req) => {
          const path = req.url.replace(/^https:\/\/api.github.com/, '').replace(/\/\//g, '/');
          switch (path) {
            // TODO: The import should not try to load the func.yaml, it should check this based on the file list upfront.
            case '/repos/devfile-samples/devfile-sample-go-basic/contents/func.yaml':
              req.reply({
                statusCode: 404,
                headers: {
                  'content-type': 'application/json',
                },
                body: {
                  message: 'Not Found',
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  documentation_url:
                    'https://docs.github.com/rest/reference/repos#get-repository-content',
                },
              });
              break;
            default: {
              let fixture = req.url.replace('https://', 'add-flow/');
              if (fixture.endsWith('/')) {
                fixture = fixture.substring(0, fixture.length - 1);
              }
              req.reply({
                headers: {
                  'content-type': 'application/json',
                },
                fixture,
              });
            }
          }
        });
        cy.get(samplesPO.cards.basicgoTemplate)
          .first()
          .click();
        break;
      }
      default: {
        throw new Error(`${card} card is not available in Catalog`);
      }
    }
  },
};
