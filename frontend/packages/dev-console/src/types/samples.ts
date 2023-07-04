import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';

/**
 * ConsoleSample is an extension to customizing OpenShift web console by adding samples.
 */
export type ConsoleSample = K8sResourceCommon & {
  spec: ConsoleSampleSpec;
};

/**
 * ConsoleSampleSpec is the desired sample for the web console.
 * Samples will appear with their title, descriptions and a badge in a samples catalog.
 */
export type ConsoleSampleSpec = {
  /**
   * title is the display name of the sample.
   *
   * It is required and must be no more than 50 characters in length.
   */
  title: string;
  /**
   * abstract is a short introduction to the sample.
   *
   * It is required and must be no more than 100 characters in length.
   *
   * The abstract is shown on the sample card tile below the title and provider
   * and is limited to three lines of content.
   */
  abstract: string;
  /**
   * description is a long form explanation of the sample.
   *
   * It is required and can have a maximum length of **4096** characters.
   *
   * It is a README.md-like content for additional information, links, pre-conditions, and other instructions.
   * It will be rendered as Markdown so that it can contain line breaks, links, and other simple formatting.
   */
  description: string;
  /**
   * icon is an optional base64 encoded image and shown beside the sample title.
   *
   * The format must follow the [data: URL format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)
   * and can have a maximum size of **10 KB**.
   *
   * `data:[<mediatype>][;base64],<base64 encoded image>`
   *
   * For example:
   *
   * `data:image;base64,` plus the base64 encoded image.
   *
   * Vector images can also be used. SVG icons must start with:
   *
   * `data:image/svg+xml;base64,` plus the base64 encoded SVG image.
   *
   * All sample catalog icons will be shown on a white background (also when the dark theme is used).
   * The web console ensures that different aspect ratios work correctly.
   * Currently, the surface of the icon is at most 40x100px.
   */
  icon?: string;
  /**
   * type is an optional label to group multiple samples.
   *
   * It is optional and must be no more than 20 characters in length.
   *
   * Recommendation is a singular term like "Builder Image", "Devfile" or "Serverless Function".
   *
   * Currently, the type is shown a badge on the sample card tile in the top right corner.
   */
  type?: string;
  /**
   * provider is an optional label to honor who provides the sample.
   *
   * It is optional and must be no more than 50 characters in length.
   *
   * A provider can be a company like "Red Hat" or an organization like "CNCF" or "Knative".
   *
   * Currently, the provider is only shown on the sample card tile below the title with the prefix "Provided by "
   */
  provider?: string;
  /**
   * tags are optional string values that can be used to find samples in the samples catalog.
   *
   * Examples of common tags may be "Java", "Quarkus", etc.
   *
   * They will be displayed on the samples details page.
   */
  tags?: string[];
  /**
   * source defines where to deploy the sample service from.
   * The sample may be sourced from an external git repository or container image.
   */
  source: ConsoleSampleSource;
};

/**
 * Union of the sample source types.
 * Unsupported samples types will be ignored in the web console.
 */
export type ConsoleSampleSource = ConsoleSampleGitImportSource | ConsoleSampleContainerImportSource;

/** ConsoleSampleGitImportSource allows the user to import code from a git repository. */
export type ConsoleSampleGitImportSource = {
  type: 'GitImport';
  gitImport: {
    /** repository contains the reference to the actual Git repository.. */
    repository: ConsoleSampleGitImportSourceRepository;
    /** service contains configuration for the Service resource created for this sample. */
    service?: ConsoleSampleGitImportSourceService;
  };
};

/** ConsoleSampleGitImportSourceRepository contains the reference to the actual Git repository. */
export type ConsoleSampleGitImportSourceRepository = {
  /**
   * url of the Git repository that contains a HTTP service.
   * The HTTP service must be exposed on the default port (8080) unless
   * otherwise configured with the port field.
   *
   * Only public repositories on GitHub, GitLab and Bitbucket are currently supported:
   *
   *   - https://github.com/<org>/<repository>
   *   - https://gitlab.com/<org>/<repository>
   *   - https://bitbucket.org/<org>/<repository>
   *
   * The url must have a maximum length of 256 characters.
   */
  url: string;
  /**
   * revision is the git revision at which to clone the git repository
   * Can be used to clone a specific branch, tag or commit SHA.
   * Must be at most 256 characters in length.
   * When omitted the repository's default branch is used.
   */
  revision?: string;
  /**
   * contextDir is used to specify a directory within the repository to build the
   * component.
   * Must start with `/` and have a maximum length of 256 characters.
   * When omitted, the default value is to build from the root of the repository.
   */
  contextDir?: string;
};

/**
 * ConsoleSampleGitImportSourceService allows the samples author define defaults
 * for the Service created for this sample
 */
export type ConsoleSampleGitImportSourceService = {
  /**
   * targetPort is the port that the service listens on for HTTP requests.
   * This port will be used for Service created for this sample.
   * Port must be in the range 1 to 65535.
   * Default port is 8080.
   */
  targetPort?: number;
};

/** ConsoleSampleContainerImportSource allows the user import a container image. */
export type ConsoleSampleContainerImportSource = {
  type: 'ContainerImport';
  containerImport: {
    /**
     * reference to a container image that provides a HTTP service.
     * The service must be exposed on the default port (8080) unless
     * otherwise configured with the port field.
     *
     * Supported formats:
     *   - <repository-name>/<image-name>
     *   - docker.io/<repository-name>/<image-name>
     *   - quay.io/<repository-name>/<image-name>
     *   - quay.io/<repository-name>/<image-name>@sha256:<image hash>
     *   - quay.io/<repository-name>/<image-name>:<tag>
     */
    image: string;
    /** service contains configuration for the Service resource created for this sample. */
    service?: ConsoleSampleContainerImportSourceService;
  };
};

/**
 * ConsoleSampleContainerImportSourceService allows the samples author define defaults
 * for the Service created for this sample
 */
export type ConsoleSampleContainerImportSourceService = {
  /**
   * targetPort is the port that the service listens on for HTTP requests.
   * This port will be used for Service created for this sample.
   * Port must be in the range 1 to 65535.
   * Default port is 8080.
   */
  targetPort?: number;
};

export function isGitImportSource(
  source: ConsoleSampleSource,
): source is ConsoleSampleGitImportSource {
  return source?.type === 'GitImport' && !!source.gitImport?.repository?.url;
}

export function isContainerImportSource(
  source: ConsoleSampleSource,
): source is ConsoleSampleContainerImportSource {
  return source?.type === 'ContainerImport' && !!source.containerImport?.image;
}
