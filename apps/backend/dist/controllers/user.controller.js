import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { PasswordResetService } from '../services/password-reset.service.js';
import { isProd } from '../config/environment.js';
import { sendResponse } from '../utils/response.js';
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
};
export class UserController {
    static async login(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            if (refreshToken) {
                await AuthService.logoutSession(refreshToken);
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return sendResponse({ res, message: 'Logged out successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async registerEmployee(req, res, next) {
        try {
            const result = await UserService.createEmployee(req.body);
            return sendResponse({ res, statusCode: 201, message: 'Employee registered', data: result.user });
        }
        catch (error) {
            next(error);
        }
    }
    static async registerCustomer(req, res, next) {
        try {
            const result = await UserService.createCustomer(req.body);
            return sendResponse({ res, statusCode: 201, message: 'Customer registered', data: result.user });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllEmployees(req, res, next) {
        try {
            const data = await UserService.listAllEmployees();
            return sendResponse({ res, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllAgents(req, res, next) {
        try {
            const data = await UserService.listAllAgents();
            return sendResponse({ res, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllCustomers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const data = await UserService.listAllCustomers(page, limit);
            return sendResponse({ res, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateEmployee(req, res, next) {
        try {
            const data = await UserService.updateEmployee(req.params.id, req.body);
            return sendResponse({ res, message: 'Employee updated successfully', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteEmployee(req, res, next) {
        try {
            await UserService.deleteEmployee(req.params.id);
            return sendResponse({ res, message: 'Employee deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteCustomer(req, res, next) {
        try {
            await UserService.deleteCustomer(req.params.id);
            return sendResponse({ res, message: 'Customer deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            await UserService.updatePassword(req.user.userId, req.body);
            // Logout the user from this current session too so they must re-login with new password
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return sendResponse({ res, message: 'Password updated successfully. Please log in again.' });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const user = await UserService.updateUserProfile(req.user.userId, req.body);
            return sendResponse({ res, message: 'Profile updated successfully', data: { user } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCurrentUser(req, res, next) {
        try {
            const user = await UserService.getCurrentUserDetails(req.user.userId);
            return sendResponse({ res, data: { user } });
        }
        catch (error) {
            next(error);
        }
    }
    static async forgotPassword(req, res, next) {
        try {
            const result = await PasswordResetService.requestPasswordReset(req.body.email);
            return sendResponse({ res, message: result.message });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyOtp(req, res, next) {
        try {
            await PasswordResetService.verifyOtp(req.body.email, req.body.otpCode);
            return sendResponse({ res, message: 'OTP verified successfully. You may now reset your password.' });
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            await PasswordResetService.completePasswordReset(req.body.email, req.body.otpCode, req.body.newPassword);
            return sendResponse({ res, message: 'Password has been reset successfully. You can now login.' });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=user.controller.js.map