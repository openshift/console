export enum ODFQueries {
  LATENCY = 'LAT',
  IOPS = 'IOPS',
  THROUGHPUT = 'THROUGHPUT',
  RAW_CAPACITY = 'RAW_CAP',
  USED_CAPACITY = 'USED_CAP',
  HEALTH = 'HEALTH',
}

export const ODF_QUERIES: { [key in ODFQueries]: string } = {
  [ODFQueries.LATENCY]: 'odf_system_latency_seconds',
  [ODFQueries.IOPS]: 'odf_system_iops_total_bytes',
  [ODFQueries.THROUGHPUT]: 'odf_system_throughput_total_bytes',
  [ODFQueries.RAW_CAPACITY]: 'odf_system_raw_capacity_total_bytes',
  [ODFQueries.USED_CAPACITY]: 'odf_system_raw_capacity_used_bytes',
  [ODFQueries.HEALTH]:
    '(label_replace(odf_system_map , "managedBy", "$1", "target_name", "(.*)"))  * on (namespace, managed_by) group_right(storage_system) odf_system_health_status',
};
