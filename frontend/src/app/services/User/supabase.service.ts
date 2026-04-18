import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {
            persistSession: true,
            storageKey: 'sb-auth-token',
            storage: localStorage,
            lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn()
          }
        }
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
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop();
    const path = `${conversationId}/photo.${ext}`;

    const { error } = await this.supabase.storage
        .from('group-photos')
        .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = this.supabase.storage
        .from('group-photos')
        .getPublicUrl(path);

    return data.publicUrl;
  }
}