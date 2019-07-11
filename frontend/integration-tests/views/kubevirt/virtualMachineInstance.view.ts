/* eslint-disable no-unused-vars, no-undef */
import { $$ } from 'protractor';

export const volumeRowsTable = $$('.co-m-pane__body').filter((table) => table.$('.co-section-heading').getText().then(text => text === 'Mounted Volumes')).first();
export const volumeRows = volumeRowsTable.$('.co-m-table-grid__body').$$('.row');
export const volumeRowByName = (name: string) => volumeRows.filter((row) => row.$('div').getText().then(text => text === name)).first();
