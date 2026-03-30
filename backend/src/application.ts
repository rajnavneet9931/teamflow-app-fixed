import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {JWTAuthenticationComponent, TokenServiceBindings} from '@loopback/authentication-jwt';
import cookieParser from 'cookie-parser';
import {CookieJwtStrategy} from './services/cookie-jwt.strategy';

export {ApplicationConfig};

export class BackendApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super({
      ...options,
      rest: {
        cors: {
          origin: true,
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization'],
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        },
      },
    });

    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET ?? 'secret',
    );
    this.expressMiddleware('middleware.cookieParser', cookieParser());
    registerAuthenticationStrategy(this, CookieJwtStrategy);

    this.sequence(MySequence);
    this.static('/', path.join(__dirname, '../public'));

    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
