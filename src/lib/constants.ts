export const BRANDS_LIST = [
    'ITEL',
    'TECNO',
    'INFINIX',
    'SAMSUNG',
    'APPLE',
    'REDMI',
    'GOOGLE PIXEL',
    'AUTRE'
] as const;

export type BrandName = typeof BRANDS_LIST[number];
