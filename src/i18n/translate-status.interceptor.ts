import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ResponseObject {
  [key: string]: any;
}

@Injectable()
export class TranslateStatusInterceptor implements NestInterceptor {

  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map(async(response) => {
        return await this.translateStatus(context.switchToHttp().getRequest().i18nLang, response);
      } ));
  }

  private async translateStatus(lang: string, object?: ResponseObject|ResponseObject[]|null|undefined): Promise<ResponseObject|ResponseObject[]|null|undefined> {
    if (!object) {
      return object;
    }

    if (Array.isArray(object)) {
      return await Promise.all(object.map((item: ResponseObject): Promise<ResponseObject> => this.translateStatus(lang, item)));
    }

    if (object.items && Array.isArray(object.items)) {
      object.items = await this.translateStatus(lang, object.items);

      return object;
    }

    if (object.status) {
      object.statusLocalized = object.status;
      const objectType = object.constructor.name.replace('Dto', '').toUpperCase();
      try {
        object.statusLocalized = await this.i18n.translate(`status.${objectType}_${object.status.toUpperCase()}`, { lang });
      } catch (error) {
        console.warn(`Could not find translation for status ${object.status}`);
      }
    }

    return object;
  }
}
