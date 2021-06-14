import { When } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '../../constants';
import { addPage, gitPage, catalogPage } from '../../pages';

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
