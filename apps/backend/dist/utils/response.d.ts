import { Response } from 'express';
export interface ApiResponseOptions {
    res: Response;
    statusCode?: number;
    message?: string;
    data?: any;
    success?: boolean;
}
export declare const sendResponse: ({ res, statusCode, message, data, success }: ApiResponseOptions) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map