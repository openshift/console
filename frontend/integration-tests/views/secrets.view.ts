import { $, $$ } from 'protractor';

export const secretNameInput = $('#secret-name');
export const pre = $$('.co-copy-to-clipboard__text');

export const saveButton = $('#save-changes');
export const errorMessage = $('.alert-danger');

export const webhookSecretValue = 'webhookValue';
export const webhookSecretValueInput = $('#webhook-secret-key');

export const createWebhookSecretLink = $('#webhook-link');
