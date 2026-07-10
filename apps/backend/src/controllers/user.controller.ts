import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { PasswordResetService } from '../services/password-reset.service.js';
import { isProd, env } from '../config/environment.js';
import { sendResponse } from '../utils/response.js';
import { UserRole } from '../types/dto.js';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
};

export class UserController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.loginUser(req.body, {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      });

      res.cookie('accessToken', result.accessToken, { ...cookieOptions, maxAge: 3 * 24 * 60 * 60 * 1000 });
      res.cookie('refreshToken', result.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return sendResponse({
        res,
        message: 'Login successful',
        data: { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return sendResponse({ res, statusCode: 401, success: false, message: 'Refresh token required' });
      }

      const result = await AuthService.refreshSession(refreshToken, {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      });

      res.cookie('accessToken', result.accessToken, { ...cookieOptions, maxAge: 3 * 24 * 60 * 60 * 1000 });
      res.cookie('refreshToken', result.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return sendResponse({
        res,
        message: 'Token refreshed',
        data: { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await AuthService.logoutSession(refreshToken);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return sendResponse({ res, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async registerEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.createEmployee(req.body);
      return sendResponse({ res, statusCode: 201, message: 'Employee registered', data: result.user });
    } catch (error) {
      next(error);
    }
  }

  static async registerCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.createCustomer(req.body);
      return sendResponse({ res, statusCode: 201, message: 'Customer registered', data: result.user });
    } catch (error) {
      next(error);
    }
  }

  static async getAllEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as unknown as string) || 1;
      const limit = parseInt(req.query.limit as unknown as string) || 10;
      const data = await UserService.listAllEmployees(page, limit);
      return sendResponse({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.listAllAgents();
      return sendResponse({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as unknown as string) || 1;
      const limit = parseInt(req.query.limit as unknown as string) || 10;
      const search = (req.query.search as string) || undefined;
      const data = await UserService.listAllCustomers(page, limit, search);
      return sendResponse({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllNotLinkedCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      
      const data = await UserService.listAllNotLinkedCustomers();
      return sendResponse({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.updateEmployee((req.params.id as string), req.body);
      return sendResponse({ res, message: 'Employee updated successfully', data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteEmployee((req.params.id as string));
      return sendResponse({ res, message: 'Employee deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.updateCustomer((req.params.id as string), req.body);
      return sendResponse({ res, message: 'Customer updated successfully', data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteCustomer((req.params.id as string));
      return sendResponse({ res, message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.updatePassword(req.user!.userId, req.body);
      
      // Logout the user from this current session too so they must re-login with new password
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      return sendResponse({ res, message: 'Password updated successfully. Please log in again.' });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role === UserRole.USER) {
        return sendResponse({ res, statusCode: 403, success: false, message: 'Customers are not allowed to update profile details' });
      }
      const user = await UserService.updateUserProfile(req.user!.userId, req.body);
      return sendResponse({ res, message: 'Profile updated successfully', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      // The profile-upload.middleware attaches the URL to req.body.profile_image
      const profileImageUrl = req.body.profile_image;
      if (!profileImageUrl) {
        return sendResponse({ res, statusCode: 400, message: 'Upload failed' });
      }
      
      const user = await UserService.updateUserProfile(req.user!.userId, { profile_image: profileImageUrl });
      return sendResponse({ res, message: 'Profile image uploaded successfully', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async removeProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      // Set profile_image to null in DB
      const user = await UserService.updateUserProfile(req.user!.userId, { profile_image: null });
      return sendResponse({ res, message: 'Profile image removed successfully', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getCurrentUserDetails(req.user!.userId);
      return sendResponse({ res, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PasswordResetService.requestPasswordReset(req.body.email);
      return sendResponse({ res, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.verifyOtp(req.body.email, req.body.otpCode);
      return sendResponse({ res, message: 'OTP verified successfully. You may now reset your password.' });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.completePasswordReset(req.body.email, req.body.otpCode, req.body.newPassword);
      return sendResponse({ res, message: 'Password has been reset successfully. You can now login.' });
    } catch (error) {
      next(error);
    }
  }

  static async getMyConnections(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getCurrentUserDetails(req.user!.userId);
      if (!user) {
        return sendResponse({ res, statusCode: 404, success: false, message: 'User not found' });
      }

      const searchUrl = `${env.crmApiUrl}/customers?search=${encodeURIComponent(user.name)}&page=1&limit=1`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'x-api-key': env.crmApiKey }
      });

      
      if (!searchRes.ok) {
        throw new Error(`CRM API error: ${searchRes.statusText}`);
      }
      const searchData = await searchRes.json();
      
      if (!searchData.customers || searchData.customers.length === 0) {
        return sendResponse({ res, data: { connections: [] } });
      }
    

      const crmCustomerId = searchData.customers[0].id || searchData.customers[0].id;

      const connUrl = `${env.crmApiUrl}/customers/${crmCustomerId}/connections`;
      const connRes = await fetch(connUrl, {
        headers: { 'x-api-key': env.crmApiKey }
      });
      if (!connRes.ok) {
        throw new Error(`CRM API error: ${connRes.statusText}`);
      }
      const connData = await connRes.json();

      let connections = [];
      if (connData.success && Array.isArray(connData.connections)) {
        connections = connData.connections
          .filter((c: any) => {
             const status = (c.status || c.workflowStatus)?.toLowerCase() || '';
             if (status === 'active' || status === 'termination' || status === 'under termination'|| status === 'notice period') return true;
             if (status === 'generation') {
               return c.history?.some((h: any) => h.action?.toUpperCase() === 'ACTIVATED');
             }
             return false;
          })
          .map((c: any) => ({
             id: c.crmConnectionId || c._id,
             fabCircuitId: c.fabCircuitId,
             opportunityId: c.opportunityId,
             bEndBtsId: c.technicalDetails?.bEnd?.btsId || 'N/A'
          }));
      }

      return sendResponse({ res, data: { connections } });
    } catch (error) {
      next(error);
    }
  }



  static async getOutstandingBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getCurrentUserDetails(req.user!.userId);
      if (!user) return sendResponse({ res, statusCode: 404, success: false, message: 'User not found' });
      
      const customerName = user.name as string;
      
      if (!customerName) return sendResponse({ res, statusCode: 400, message: 'Customer name is required' });

      const outstandingBalance = await UserService.getOutstandingBalance(customerName);
      return sendResponse({ res, data: { outstandingBalance } });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerConnectionsById(req: Request, res: Response, next: NextFunction) {
    try {
      const customerRowId = req.params.id as string;
      const user = await UserService.getCustomerUserByRowId(customerRowId);
      if (!user) {
        return sendResponse({ res, statusCode: 404, success: false, message: 'Customer or User not found' });
      }


      const searchName = user.name.trim().toUpperCase()
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
        
      const searchUrl = `${env.crmApiUrl}/customers?search=${encodeURIComponent(searchName)}&page=1&limit=1000`;
      // const searchUrl = `${env.crmApiUrl}/customers?search=${encodeURIComponent(user.name.trim().toUpperCase())}&page=1&limit=1`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'x-api-key': env.crmApiKey }
      });

      if (!searchRes.ok) {
        throw new Error(`CRM API error: ${searchRes.statusText}`);
      }
      const searchData = await searchRes.json();
      
      if (!searchData.customers || searchData.customers.length === 0) {
        return sendResponse({ res, data: { connections: [] } });
      }

      // const crmCustomerId = searchData.customers[0].id;

      // Fetch connections for all matching customers
      const connectionResponses = await Promise.all(
        searchData.customers.map(async (customer: any) => {
          const connUrl = `${env.crmApiUrl}/customers/${customer.id}/connections`;
          const connRes = await fetch(connUrl, {
            headers: { "x-api-key": env.crmApiKey }
          });
  
          if (!connRes.ok) {
            throw new Error(`CRM API error: ${connRes.statusText}`);
          }
  
          return connRes.json();
        })
      );

      let connections: any[] = [];
      for (const connData of connectionResponses) {
        if (connData.success && Array.isArray(connData.connections)) {
          connections.push(
            ...connData.connections
              .filter((c: any) => {
                 const status = (c.status || c.workflowStatus)?.toLowerCase() || '';
                 if (status === 'active' || status === 'termination' || status === 'under termination' || status === 'notice period') return true;
                 if (status === 'generation') {
                   return c.history?.some((h: any) => h.action?.toUpperCase() === 'ACTIVATED');
                 }
                 return false;
              })
              .map((c: any) => ({
             id: c.crmConnectionId || c._id,
             fabCircuitId: c.fabCircuitId,
             opportunityId: c.opportunityId,
             aEndBtsId: c.technicalDetails?.aEnd?.btsId || 'N/A',
             bEndBtsId: c.technicalDetails?.bEnd?.btsId || 'N/A'
              }))
           );
         }
      }

      // Remove duplicate connections (optional)
      connections = Array.from(
        new Map(connections.map((c) => [c.id, c])).values()
      );

      return sendResponse({ res, data: { connections } });
    } catch (error) {
      next(error);
    }
  }
}
