import { Injectable, Inject } from "@angular/core";
import { XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Http, Headers} from "@angular/http";
import { Observable } from "rxjs/Rx";
import { ServerlessConfig } from './serverless.calls';

@Injectable()
export class ServerlessService extends Http {
    constructor(
        public backend: XHRBackend, 
        public defaultOptions: RequestOptions
    ) {
        super(backend, defaultOptions);
        console.log("HTTP Interceptor init with config:",ServerlessConfig);
    }

    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
        console.log('Got request',url.url)
        let call = ServerlessConfig.calls[url.url];
        if (call){
            console.log(`Recieved serverless request. Making the request to ${ServerlessConfig.platform}`);
            return super.post(ServerlessConfig.platform+'/run',{code: call});
        } else {
            return super.request(url, options);
        }
    }

    get(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return super.get(url, this.getRequestOptionArgs(options));
    }

    post(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
        return super.post(url, body, this.getRequestOptionArgs(options));
    }

    put(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
        return super.put(url, body, this.getRequestOptionArgs(options));
    }

    delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return super.delete(url, this.getRequestOptionArgs(options));
    }

    private getRequestOptionArgs(options?: RequestOptionsArgs) : RequestOptionsArgs {
        if (options == null) {
            options = new RequestOptions();
        }
        if (options.headers == null) {
            options.headers = new Headers();
        }
        options.headers.append('Content-Type', 'application/json');

        return options;
    }
};