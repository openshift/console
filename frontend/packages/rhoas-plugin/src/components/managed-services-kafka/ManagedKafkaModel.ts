
/**
 * List properties that can appear on managed kafka
 */
export type ManagedKafkaModel = {
  id: string,
  status?: string,
  cloud_provider: "aws" | string,
  region: string,
  owner: string,
  name: string,
  bootstrapServerHost?: string
  created_at: string,
  updated_at: string
};
