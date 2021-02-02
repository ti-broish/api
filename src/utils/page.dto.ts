import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';

export class PageDTO {
    @Optional()
    @Transform((pageQuery: string) => {
        const page = parseInt(pageQuery, 10);
        if (isNaN(page)) {
          return 0;
        }

        return Math.max(page, 1);
    })
    page: number = 1;
}
