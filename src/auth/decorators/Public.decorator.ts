import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Allow setting @Public() to any route which should bypass authentication
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
