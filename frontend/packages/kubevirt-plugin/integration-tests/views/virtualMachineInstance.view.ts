import { $$ } from 'protractor';

export const volumeRowsTable = $$('.co-m-pane__body')
  .filter((table) =>
    table
      .$('.co-section-heading')
      .getText()
      .then((text) => text === 'Volumes'),
  )
  .first();

export const volumeRows = volumeRowsTable.$$('[data-test-rows="resource-row"]');
export const volumeRowByName = (name: string) =>
  volumeRows
    .filter((row) =>
      row
        .$$('td')
        .first()
        .getText()
        .then((text) => text === name),
    )
    .first();
