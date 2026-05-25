import busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';
import { fileTypeStream } from 'file-type';
import { Readable } from 'stream';
import { UploadService } from '../services/upload.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import crypto from 'crypto';

export const parseProfileImageUpload = () => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.is('multipart/form-data')) {
    return next(new AppError(400, 'Expected multipart/form-data', ErrorCodes.VALIDATION_ERROR));
  }

  const bb = busboy({ 
    headers: req.headers,
    limits: {
      files: 1, // Only 1 profile image at a time
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });

  req.body = req.body || {};
  let uploadPromise: Promise<void> | null = null;
  let fileError: Error | null = null;

  bb.on('file', (name, file, info) => {
    if (fileError) {
      file.resume();
      return;
    }

    const nonce = crypto.randomUUID();
    const publicId = `user-${req.user!.userId}-${Date.now()}-${nonce}`;

    const uploadTask = async () => {
      try {
        const webStream = Readable.toWeb(file);
        const streamWithFileType = await fileTypeStream(webStream);
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!streamWithFileType.fileType || !allowedTypes.includes(streamWithFileType.fileType.mime)) {
           throw new AppError(400, 'Invalid file type. Only JPEG, PNG, WEBP, HEIC, and HEIF are allowed.', ErrorCodes.VALIDATION_ERROR);
        }

        const nodeStream = Readable.fromWeb(streamWithFileType as any);
        const secureUrl = await UploadService.uploadImageStream(nodeStream, publicId);
        
        req.body.profile_image = secureUrl;
      } catch (err) {
        fileError = err as Error;
        file.resume();
      }
    };
    
    uploadPromise = uploadTask();
  });

  bb.on('filesLimit', () => {
    fileError = new AppError(400, 'Maximum of 1 profile image allowed', ErrorCodes.VALIDATION_ERROR);
  });

  bb.on('finish', async () => {
    try {
      if (uploadPromise) {
        await uploadPromise;
      }
      
      if (fileError) {
        return next(fileError);
      }
      
      if (!req.body.profile_image) {
        return next(new AppError(400, 'No image uploaded', ErrorCodes.VALIDATION_ERROR));
      }

      next();
    } catch (err) {
      next(err);
    }
  });

  bb.on('error', () => {
    next(new AppError(500, 'Upload parsing failed', ErrorCodes.INTERNAL_ERROR));
  });

  req.pipe(bb);
};
