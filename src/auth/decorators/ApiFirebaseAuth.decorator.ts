import { ApiSecurity } from '@nestjs/swagger';

export function ApiFirebaseAuth(name = 'firebase') {
  return ApiSecurity(name);
}
