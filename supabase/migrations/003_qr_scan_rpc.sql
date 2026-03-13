-- Migration 003: QR scan count increment function
-- This function allows anonymous users to increment scan_count
-- without needing UPDATE permissions on qr_codes table.

CREATE OR REPLACE FUNCTION increment_qr_scan(qr_table_number TEXT, qr_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE qr_codes
  SET scan_count = scan_count + 1
  WHERE tenant_id = qr_tenant_id
    AND table_number = qr_table_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
