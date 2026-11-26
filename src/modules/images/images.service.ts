import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadImageResult } from './interfaces/image.interface';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Upload an image buffer to ImgBB using the IMAGE_BB API key.
   * Returns hosted ImgBB URL. If network/ImgBB is unreachable, falls back to data URI.
   */
  async uploadToImgBB(
    buffer: Buffer,
    filename: string = 'image.png',
    mimeType: string = 'image/png',
  ): Promise<{ url: string; displayUrl?: string; deleteUrl?: string }> {
    const apiKey =
      this.configService.get<string>('images.imgbbApiKey') ||
      process.env.IMAGE_BB;

    if (!apiKey) {
      this.logger.warn('IMAGE_BB API key is missing. Falling back to data URI.');
      return { url: `data:${mimeType};base64,${buffer.toString('base64')}` };
    }

    try {
      const base64Data = buffer.toString('base64');
      const formData = new FormData();
      formData.append('image', base64Data);
      formData.append('name', filename.replace(/\.[^/.]+$/, ''));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          body: formData,
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const json: any = await response.json();
        const hostedUrl = json?.data?.url || json?.data?.display_url;
        if (hostedUrl) {
          this.logger.log(`Image successfully hosted on ImgBB: ${hostedUrl}`);
          return {
            url: hostedUrl,
            displayUrl: json?.data?.display_url,
            deleteUrl: json?.data?.delete_url,
          };
        }
      }

      const errorText = await response.text();
      this.logger.warn(
        `ImgBB returned status ${response.status}: ${errorText.slice(0, 150)}`,
      );
    } catch (err: any) {
      this.logger.warn(`Failed to connect to ImgBB: ${err?.message || err}`);
    }

    // Fallback: return data URI so database save and preview still work reliably
    return { url: `data:${mimeType};base64,${buffer.toString('base64')}` };
  }

  /**
   * Validate uploaded file and upload to ImgBB
   */
  async handleImageUpload(file: Express.Multer.File): Promise<UploadImageResult> {
    if (!file) {
      throw new BadRequestException('No image file was uploaded.');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type (${file.mimetype}). Please upload JPG, PNG, WEBP, or GIF.`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      );
    }

    const { url, displayUrl, deleteUrl } = await this.uploadToImgBB(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      url,
      displayUrl,
      deleteUrl,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
