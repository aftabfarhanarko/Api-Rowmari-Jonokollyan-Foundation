declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer: Buffer;
      }
    }
  }
}

export interface UploadImageResult {
  url: string;
  displayUrl?: string;
  deleteUrl?: string;
  filename: string;
  mimeType: string;
  size: number;
}
