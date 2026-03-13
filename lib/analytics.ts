import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types';

type EventType = 'qr_scan' | 'menu_view' | 'item_view' | 'order_created';

export async function trackEvent({
  tenantId,
  eventType,
  qrCodeId,
  itemId,
  meta = {}
}: {
  tenantId: string;
  eventType: EventType;
  qrCodeId?: string;
  itemId?: string;
  meta?: Record<string, any>;
}) {
  try {
    const supabase = createClient();
    
    // Пытаемся получить сохраненный session_id из localStorage (fingerprint)
    let sessionId = null;
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('qr_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('qr_session_id', sessionId);
      }
    }

    const eventMeta = {
      ...meta,
      session_id: sessionId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        tenant_id: tenantId,
        event_type: eventType,
        qr_code_id: qrCodeId,
        item_id: itemId,
        meta: eventMeta
      } as any);

    if (error) {
      console.error('Error tracking event:', error);
    }
  } catch (err) {
    console.error('Failed to track event:', err);
  }
}
