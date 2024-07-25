/* eslint-disable no-console */
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/lib-core';

const enqueueJSON = (controller: TransformStreamDefaultController, jsonString: string) => {
  try {
    controller.enqueue(JSON.parse(jsonString));
  } catch (e) {
    console.warn(`Error parsing JSON line: ${e}\n${jsonString}`);
  }
};

export const parseJSONLines = <ObjectType>() =>
  new TransformStream<string, ObjectType>({
    start() {
      this.buffer = '';
    },
    transform(chunk, controller) {
      this.buffer += chunk;
      const lines = this.buffer.split('\n').map((l) => l?.trim());
      this.buffer = this.buffer.endsWith('\n') ? '' : lines.pop().trim();
      lines.forEach((line) => {
        if (line) {
          enqueueJSON(controller, line);
        }
      });
    },
    flush(controller) {
      if (this.buffer) {
        enqueueJSON(controller, this.buffer);
      }
    },
  });

// ObjectType is the expected shape of each JSON object (defaults to any).
// HandlerResult is the expected value the handler will resolve when called with ObjectType as an argument
export const fetchAndProcessJSONLines = <ObjectType = any>(
  url: string,
  options,
): Promise<ReadableStreamDefaultReader<ObjectType>> =>
  consoleFetch(url, options).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough<ObjectType>(parseJSONLines<ObjectType>())
      .getReader();
  });
