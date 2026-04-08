import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubChannel {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  isPostChannel?: boolean;
  createdAt?: string;
  createdBy?: string;
  memberIds?: string[];
  subChannels: SubChannel[];
  audioHistory?: any[];
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private apiUrl = 'http://localhost:8082/api/channels';

  constructor(private http: HttpClient) {}

  getAll(userId: string, role?: string, userPost?: string): Observable<Channel[]> {
    let params = `userId=${userId}`;
    if (role) params += `&role=${role}`;
    if (userPost) params += `&userPost=${encodeURIComponent(userPost)}`;
    return this.http.get<Channel[]>(`${this.apiUrl}?${params}`);
  }

  ensurePostChannel(postName: string, memberId: string): Observable<Channel> {
    return this.http.post<Channel>(
      `${this.apiUrl}/post-channel/${encodeURIComponent(postName)}/${memberId}`,
      {}
    );
  }

  create(
    channel: { name: string; isPrivate: boolean; memberIds: string[] },
    userId: string,
    role: string
  ): Observable<Channel> {
    return this.http.post<Channel>(
      `${this.apiUrl}?userId=${userId}&role=${role}`,
      channel
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addMember(channelId: string, memberId: string): Observable<Channel> {
    return this.http.post<Channel>(`${this.apiUrl}/${channelId}/members/${memberId}`, {});
  }

  removeMember(channelId: string, memberId: string): Observable<Channel> {
    return this.http.delete<Channel>(`${this.apiUrl}/${channelId}/members/${memberId}`);
  }

  addSubChannel(channelId: string, subChannel: { name: string }): Observable<Channel> {
    return this.http.post<Channel>(`${this.apiUrl}/${channelId}/sub-channels`, subChannel);
  }

  deleteSubChannel(channelId: string, subChannelId: string): Observable<Channel> {
    return this.http.delete<Channel>(`${this.apiUrl}/${channelId}/sub-channels/${subChannelId}`);
  }
}
