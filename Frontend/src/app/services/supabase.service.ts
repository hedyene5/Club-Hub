import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
  async uploadGroupPhoto(conversationId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${conversationId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
        .from('group-photos')           // ← your bucket name
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
        .from('group-photos')
        .getPublicUrl(fileName);

    return publicUrl;   // ← e.g. https://your-project.supabase.co/storage/v1/object/public/group-photos/xxx.jpg
  }
}