import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class MediaStorageProvider {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucket = this.configService.get<string>(
      'SUPABASE_BUCKET',
      'shopfinity',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async generateSignedUploadUrl(path: string) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to generate signed upload URL: ${error.message}`,
      );
    }

    return {
      signUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    };
  }

  async exists(path: string): Promise<boolean> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .exists(path);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to check if file exists: ${error.message}`,
      );
    }

    return data;
  }
}
