import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { StorageService } from '../../../core/storage/storage.service.js';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard.js';
import * as fs from 'fs';

@Controller('docsafe/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: any) {
    const data = await this.service.findAll(req.user.tenantId, query);
    return { success: true, message: 'Documents fetched successfully', data };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.findOne(req.user.tenantId, id);
    return { success: true, message: 'Document fetched successfully', data };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const data = await this.service.create(req.user.tenantId, req.user.id, body);
    return { success: true, message: 'Document created successfully', data };
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(req.user.tenantId, id, req.user.id, body);
    return { success: true, message: 'Document updated successfully', data };
  }

  @Post(':id/upload')
  async uploadFile(@Request() req: any, @Param('id') id: string) {
    let filePart: any;
    try {
      filePart = await req.file();
    } catch (e: any) {
      throw new BadRequestException('Failed to process multipart upload: ' + (e?.message || e));
    }

    if (!filePart) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimes.includes(filePart.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: PDF, PNG, JPG');
    }

    const buffer = await filePart.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File exceeds 10MB limit');
    }

    const fileAsset = await this.storageService.uploadFile(req.user.tenantId, req.user.id, {
      filename: filePart.filename,
      mimetype: filePart.mimetype,
      buffer,
    });

    const updatedDoc = await this.service.attachFile(
      req.user.tenantId,
      id,
      req.user.id,
      fileAsset.id,
    );

    return { success: true, message: 'File uploaded successfully', data: updatedDoc };
  }

  @Get(':id/file')
  async getFile(@Request() req: any, @Param('id') id: string, @Res() reply: any) {
    const doc = await this.service.findOne(req.user.tenantId, id);
    if (!doc.fileAssetId) {
      throw new NotFoundException('Document has no attached file');
    }

    const { fileAsset, filePath } = await this.storageService.getFile(req.user.tenantId, doc.fileAssetId);
    const stream = fs.createReadStream(filePath);

    reply.raw.setHeader('Content-Type', fileAsset.mimeType);
    reply.raw.setHeader('Content-Disposition', `inline; filename="${fileAsset.originalFilename}"`);
    return reply.send(stream);
  }

  @Post(':id/renewal')
  async initiateRenewal(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.service.initiateRenewal(req.user.tenantId, id, req.user.id, body.remarks);
    return { success: true, message: 'Renewal initiated successfully', data };
  }

  @Get(':id/history')
  async getHistory(@Request() req: any, @Param('id') id: string) {
    const data = await this.service.getHistory(req.user.tenantId, id);
    return { success: true, message: 'Document history fetched successfully', data };
  }
}
