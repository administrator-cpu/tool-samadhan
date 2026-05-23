export const sendResponse = ({ res, statusCode = 200, message = 'Operation successful', data = {}, success = true }) => {
    return res.status(statusCode).json({
        success,
        statusCode,
        message,
        data,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
};
//# sourceMappingURL=response.js.map