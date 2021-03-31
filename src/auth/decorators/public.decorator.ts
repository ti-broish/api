import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Set @Public() to any route which should bypass authentication altogether
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
