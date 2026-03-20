import { diskStorage } from 'multer';
import * as multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const getMulterOptions = (folder: string) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    return {
      storage: multerS3({
        s3,
        bucket: process.env.S3_BUCKET_NAME || '',
        key(req, file, cb) {
          const ext = path.extname(file.originalname);
          const uniqueFileName = `${folder}/${uuidv4()}${ext}`;
          cb(null, uniqueFileName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    };
  }

  // Local storage
  return {
    storage: diskStorage({
      destination: `./${folder}`,
      filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        const baseName = Buffer.from(path.basename(file.originalname, ext), 'latin1').toString('utf8');
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const uniqueFileName = `${baseName}_${timestamp}${ext}`;
        cb(null, uniqueFileName);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  };
};

export const getFileUrl = (file: any, folder: string): string => {
  if (file.location) {
    return file.location;
  }
  return `/${folder}/${file.filename}`;
};

export const getFileName = (file: any): string => {
  if (file.key) {
    return file.key;
  }
  return file.filename;
};
