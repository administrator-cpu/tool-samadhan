import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    static login(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static refresh(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static logout(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static registerEmployee(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static registerCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getAllEmployees(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getAllAgents(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getAllCustomers(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateEmployee(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static changePassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateProfile(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static verifyOtp(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=user.controller.d.ts.map