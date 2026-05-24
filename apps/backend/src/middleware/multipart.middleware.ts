import busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';
import { fileTypeStream } from 'file-type';
import { Readable } from 'stream';
import { UploadService } from '../services/upload.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { postgresPool } from '../config/database.js';

export const parseTicketEventUpload = async (req: Request, res: Response, next: NextFunction) => {
  // Pass through if not multipart
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const bb = busboy({ 
    headers: req.headers,
    limits: {
      files: 10,
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });

  req.body = req.body || {};
  const attachments: string[] = [];
  
  // Pre-fetch ticket details to safely generate unique public_ids
  let ticketNo = 'TKT';
  let sanitizedCustomerName = 'customer';
  
  try {
    const client = await postgresPool.connect();
    try {
      const result = await client.query(
        `SELECT t.ticket_no, cu.name AS customer_name 
         FROM tickets t 
         JOIN customers c ON c.id = t.customer_id 
         JOIN users cu ON cu.id = c.user_id
         WHERE t.id = $1`,
        [req.params.id]
      );
      if (result.rows.length > 0) {
        ticketNo = result.rows[0].ticket_no.replace(/[^0-9]/g, '');
        sanitizedCustomerName = result.rows[0].customer_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ''); // strict alphanumeric sanitization
      }
    } finally {
      client.release();
    }
  } catch (error) {
    return next(new AppError(500, 'Failed to resolve ticket metadata for upload', ErrorCodes.INTERNAL_ERROR));
  }

  let uploadPromises: Promise<void>[] = [];
  let fileError: Error | null = null;

  bb.on('field', (fieldname, val) => {
    req.body[fieldname] = val;
  });

  bb.on('file', (name, file, info) => {
    // If an error already occurred (e.g. invalid type), discard remaining files
    if (fileError) {
      file.resume();
      return;
    }

    // Do NOT unpipe req. Busboy natively processes multipart streams sequentially.
    // req.unpipe(bb);
    
    const publicId = `${sanitizedCustomerName}-${ticketNo}-${Date.now()}`;
    
    const uploadTask = async () => {
      try {
        // fileTypeStream in newer versions expects a Web ReadableStream
        const webStream = Readable.toWeb(file);
        const streamWithFileType = await fileTypeStream(webStream);
        
        // Validate MIME securely
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!streamWithFileType.fileType || !allowedTypes.includes(streamWithFileType.fileType.mime)) {
           throw new AppError(400, 'Invalid file type. Only JPEG, PNG, WEBP, HEIC, and HEIF are allowed.', ErrorCodes.VALIDATION_ERROR);
        }

        // Convert back to Node.js stream for Cloudinary piping
        const nodeStream = Readable.fromWeb(streamWithFileType as any);

        // Upload to Cloudinary
        const secureUrl = await UploadService.uploadImageStream(nodeStream, publicId);
        attachments.push(secureUrl);
        
      } catch (err) {
        fileError = err as Error;
        file.resume(); // drain current stream so busboy can finish cleanly
      } finally {
        // No need to manually pipe/unpipe
      }
    };
    
    uploadPromises.push(uploadTask());
  });

  // Handle stream abortion (e.g. max file size exceeded)
  bb.on('filesLimit', () => {
    fileError = new AppError(400, 'Maximum of 10 images allowed', ErrorCodes.VALIDATION_ERROR);
  });

  bb.on('finish', async () => {
    try {
      // Ensure all strictly sequenced tasks have completed
      await Promise.all(uploadPromises);
      
      if (fileError) {
        return next(fileError);
      }
      
      if (attachments.length > 0) {
        // Hydrate req.body for standard Zod validation
        let existingMetadata = {};
        if (req.body.metadata) {
           try {
             existingMetadata = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
           } catch (e) {}
        }
        req.body.metadata = { ...existingMetadata, attachments };
      }
      
      // Parse boolean representations passed in FormData
      if (req.body.visibleToCustomer !== undefined) {
         req.body.visibleToCustomer = req.body.visibleToCustomer === 'true';
      }

      next();
    } catch (err) {
      next(err);
    }
  });

  bb.on('error', (err) => {
    next(new AppError(500, 'Upload parsing failed', ErrorCodes.INTERNAL_ERROR));
  });

  req.pipe(bb);
};
