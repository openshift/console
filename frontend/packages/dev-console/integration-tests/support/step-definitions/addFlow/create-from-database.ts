import { When } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { catalogPage } from '../../pages/add-flow/catalog-page';
import { addOptions } from '../../constants/add';
import { gitPage } from '../../pages/add-flow/git-page';

When('user clicks Database card', () => {
  addPage.selectCardFromOptions(addOptions.Database);
});

When('user selects {string} database on Developer Catalog', (database: string) => {
  catalogPage.search(database);
  catalogPage.selectCardInCatalog(database);
});

When('user clicks create button on Instantiate Template page with default values', () => {
  gitPage.clickCreate();
});
