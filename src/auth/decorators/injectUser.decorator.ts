import { createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';

export const InjectUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
