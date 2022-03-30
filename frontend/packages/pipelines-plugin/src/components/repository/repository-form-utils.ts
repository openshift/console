import * as GitUrlParse from 'git-url-parse';
import { TFunction } from 'i18next';
import { Base64 } from 'js-base64';
import * as yup from 'yup';
import { gitUrlRegex } from '@console/dev-console/src/components/import/validation-schema';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { nameRegex } from '@console/shared/src';
import { RepositoryModel } from '../../models';

export const repositoryValidationSchema = (t: TFunction) =>
  yup.object().shape({
    name: yup
      .string()
      .matches(nameRegex, {
        message: t(
          'pipelines-plugin~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        ),
        excludeEmptyString: true,
      })
      .required(t('pipelines-plugin~Required')),
    gitUrl: yup
      .string()
      .matches(gitUrlRegex, t('pipelines-plugin~Invalid Git URL.'))
      .required(t('pipelines-plugin~Required')),
    accessToken: yup.string(),
  });

const createTokenSecret = async (repositoryName: string, token: string, namespace: string) => {
  const data: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      generateName: `${repositoryName}-token-`,
    },
    type: SecretType.opaque,
    data: {
      token: Base64.encode(token),
    },
  };

  return k8sCreateResource({
    model: SecretModel,
    data,
    ns: namespace,
  });
};

export const createRepositoryResources = async (
  name: string,
  namespace: string,
  gitUrl: string,
  token?: string,
) => {
  let secret: SecretKind;
  if (token) {
    secret = await createTokenSecret(name, token, namespace);
  }
  const gitHost = GitUrlParse(gitUrl).source;

  const data = {
    kind: RepositoryModel.kind,
    apiVersion: 'pipelinesascode.tekton.dev/v1alpha1',
    metadata: {
      name,
      namespace,
    },
    spec: {
      url: gitUrl,
      // eslint-disable-next-line @typescript-eslint/camelcase
      git_provider: {
        ...(gitHost !== 'github.com' ? { url: gitHost } : {}),
        ...(secret
          ? {
              secret: {
                name: secret.metadata.name,
                key: 'token',
              },
            }
          : {}),
      },
    },
  };

  const resource = await k8sCreateResource({
    model: RepositoryModel,
    data,
    ns: namespace,
  });

  return resource;
};
