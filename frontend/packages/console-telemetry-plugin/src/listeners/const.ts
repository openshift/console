export const SEGMENT_API_KEY = window.SERVER_FLAGS?.telemetry?.SEGMENT_API_KEY ?? '';
export const TELEMETRY_DISABLED = window.SERVER_FLAGS?.telemetry?.DISABLED === 'true';
export const TELEMETRY_DEBUG = window.SERVER_FLAGS?.telemetry?.DEBUG === 'true';
