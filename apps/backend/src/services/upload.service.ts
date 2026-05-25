import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

// Cloudinary is configured via CLOUDINARY_URL in .env natively, 
// but we can ensure it is explicitly loaded if needed.
// Example: process.env.CLOUDINARY_URL = "cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

export class UploadService {
  /**
   * Uploads a readable stream directly to Cloudinary sequentially.
   * @param fileStream The readable file stream from busboy
   * @param publicId The unique, sanitized public ID for the file
   * @returns The secure URL of the uploaded image
   */
  static async uploadImageStream(fileStream: Readable, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: UploadApiOptions = {
        public_id: publicId,
        resource_type: 'image',
        folder: 'samadhan_tickets',
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Unknown error during Cloudinary upload'));
          }
        }
      );

      // Pipe the incoming file stream into the Cloudinary upload stream
      fileStream.pipe(uploadStream);

      // Handle stream errors
      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
