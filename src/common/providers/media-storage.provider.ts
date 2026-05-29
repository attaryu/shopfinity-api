import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MediaStorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      throw new Error('AWS configuration is missing');
    }

    this.bucket = bucketName;

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async generateSignedUploadUrl(path: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const signUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

      return {
        signUrl,
        path,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to generate signed upload URL: ${error.message}`,
      );
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new InternalServerErrorException(
        `Failed to check if file exists: ${error.message}`,
      );
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }
}
