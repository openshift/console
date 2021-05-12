import { When } from 'cypress-cucumber-preprocessor/steps';
import { addPage, gitPage, catalogPage } from '../../pages';
import { addOptions } from '../../constants';

When('user clicks Database card', () => {
  addPage.selectCardFromOptions(addOptions.Database);
});

When('user selects {string} database on Developer Catalog', (database: string) => {
  catalogPage.search(database);
  catalogPage.selectCardInCatalog(database);
});

When('user clicks create button on Instantiate Template page', () => {
  gitPage.clickCreate();
});
