import { Http, XHRBackend, RequestOptions } from '@angular/http';
import { ServerlessService } from './serverless.service';

export function ServerlessFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http {
    return new ServerlessService(xhrBackend, requestOptions);
}
