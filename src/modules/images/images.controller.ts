import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ImagesService } from './images.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  @ApiOperation({
    summary: 'Upload an image file using ImgBB API key and return hosted URL',
    description:
      'Uploads image (JPG, PNG, WEBP, GIF) to ImgBB and returns permanent CDN URL to save in database.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded and URL returned' })
  @ApiResponse({ status: 400, description: 'Invalid file format or oversized file' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file received. Please provide a file in the "image" field.');
    }
    return this.imagesService.handleImageUpload(file);
  }
}
