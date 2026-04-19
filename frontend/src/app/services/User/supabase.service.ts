import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseServiceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn()
          }
        }
    );
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}.${ext}`;
    const url = `${environment.supabaseUrl}/storage/v1/object/avatars/${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${environment.supabaseServiceRoleKey}`,
          'x-upsert': 'true',
          'Content-Type': file.type
        },
        body: file,
        signal: controller.signal
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Upload failed: ${err}`);
      }

      return `${environment.supabaseUrl}/storage/v1/object/public/avatars/${path}`;
    } finally {
      clearTimeout(timeout);
    }
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