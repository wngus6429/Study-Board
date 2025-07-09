import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
// 타입 정의 충돌 방지를 위해 직접 인터페이스를 지정하지 않고 any 사용
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 공통 S3 설정을 위한 헬퍼
// 환경 변수로부터 영역(region)과 자격 증명을 읽어옵니다.

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  // },
  // credentials: {} 부분을 완전히 제거합니다.
  // AWS SDK가 EC2 인스턴스 프로파일을 자동으로 감지합니다.
});

/**
 * 주어진 폴더(prefix)에 업로드하도록 하는 multer-s3 옵션 객체를 반환합니다.
 *
 * @param folder S3 버킷 내 폴더(prefix)
 */
export const createMulterS3Options = (folder = ''): any => {
  return {
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET as string,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
        const key = folder ? `${folder}/${uniqueName}` : uniqueName;
        cb(null, key);
      },
    }),
  };
};
