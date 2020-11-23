import { Controller, Get, Post, HttpCode, Query, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiProperty } from '@nestjs/swagger';
import { Picture } from './picture';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

@Controller('pictures')
export class PicturesController {
  @Post()
  @UseInterceptors(FileInterceptor('picture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Picture upload',
    type: FileUploadDto,
  })
  uploadFile(@UploadedFile() picture): Picture {
    return new Picture();
  }

  @Get()
  @HttpCode(200)
  query(@Query('protocol') protocol?: string, @Query('report') report?: string): Array<Picture> {
    return [];
  }

  @Get(':id')
  @HttpCode(200)
  get(@Param('id') id: number): Picture {
    return new Picture();
  }
}

