import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {
    fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
  }

  async uploadFile(tenantId: string, userId: string, file: any) {
    const fileId = crypto.randomUUID();
    const safeFilename = (file.filename || file.originalname || 'document.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `${tenantId}/${fileId}-${safeFilename}`;
    const uploadPath = path.join(process.cwd(), 'uploads', storageKey);
    
    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
    fs.writeFileSync(uploadPath, file.buffer);

    return this.prisma.fileAsset.create({
      data: {
        id: fileId,
        tenantId,
        uploadedBy: userId,
        originalFilename: file.filename || file.originalname || 'document.pdf',
        storageKey,
        mimeType: file.mimetype || 'application/pdf',
        sizeBytes: file.buffer ? file.buffer.length : 0,
      }
    });
  }

  async getFile(tenantId: string, fileAssetId: string) {
    const fileAsset = await this.prisma.fileAsset.findFirst({
      where: { id: fileAssetId, tenantId },
    });
    if (!fileAsset) {
      throw new NotFoundException('File asset not found or access denied');
    }
    const filePath = path.join(process.cwd(), 'uploads', fileAsset.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File content not found on server');
    }
    return { fileAsset, filePath };
  }
}
