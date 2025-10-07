const V = import.meta.env.VITE_ASSET_VERSION ?? 'dev';
export const assetsVersion = (url: string) => `${url}?v=${V}`;
