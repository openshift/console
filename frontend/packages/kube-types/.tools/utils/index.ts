/*  eslint-disable no-console */
import * as https from 'https';
import * as http from 'http';

const getClient = (url: string) => {
  return url.startsWith('https') ? https : http;
};

export const download = (url: string) => {
  return new Promise((resolve, reject) => {
    console.log('downloading', url);
    const result = [];
    getClient(url)
      .get(url, (response) => {
        // response.setEncoding('utf8');
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`statusCode=${response.statusCode}`));
        }
        response.on('data', (chunk) => result.push(chunk));
        response.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(result).toString()));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
};
