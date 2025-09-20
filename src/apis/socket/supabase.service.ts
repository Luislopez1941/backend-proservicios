import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      // Primero intentar verificar con tu sistema JWT
      try {
        const decoded = this.jwtService.verify(token);
        return {
          id: decoded.sub,
          email: decoded.email,
          user_metadata: decoded,
        };
      } catch (jwtError) {
        // Si falla, intentar con Supabase
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        
        if (error) {
          throw new Error('Invalid token');
        }

        return user;
      }
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }

  async subscribeToChannel(channel: string, callback: (payload: any) => void) {
    const subscription = this.supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, callback)
      .subscribe();

    return subscription;
  }

  async unsubscribeFromChannel(subscription: any) {
    await this.supabase.removeChannel(subscription);
  }
}
