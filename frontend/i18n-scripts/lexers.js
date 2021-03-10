const EventEmitter = require('events');
const jsonc = require('comment-json');

/**
 * Custom JSON parser for localizing keys matching format: /%.+%/
 */
module.exports.CustomJSONLexer = class extends EventEmitter {
  extract(content, filename) {
    let keys = [];
    try {
      jsonc.parse(
        content,
        (key, value) => {
          if (typeof value === 'string') {
            const match = value.match(/^%(.+)%$/);
            if (match && match[1]) {
              keys.push({ key: match[1] });
            }
          }
          return value;
        },
        true,
      );
    } catch (e) {
      console.error('Failed to parse as JSON.', filename, e);
      keys = [];
    }
    return keys;
  }
};
