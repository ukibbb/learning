# NestJS Controller Documentation

## Overview

In Nest, almost everything is shared across incoming requests. This includes database connection pools and singleton services with global state. Since Node.js doesn't follow the request/response Multi-Threaded Stateless Model, using singleton instances is safe for applications.

However, there are edge-cases when request-based lifetime of the controller may be desired, such as:

- Per-request caching in GraphQL applications
- Request tracking
- Multi-tenancy

## Controller Implementation

```typescript
import {
  Controller,
  Get,
  Res,
  Req,
  Body,
  Next,
  Session,
  Param,
  Query,
  Headers,
  Ip,
  HostParam,
  Post,
  All,
  HttpCode,
  Header,
  Redirect,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, of } from "rxjs";
import { CatsService } from "./_service";

class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}

@Controller({ host: ":account.example.com", path: "cats" })
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async getInfo(@HostParam("account") account: string) {
    return account;
  }

  @Get()
  @Redirect("http://localhost:3000", 301)
  async findAll(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request
  ): Promise<string> {
    this.catsService.findAll();
    return "This action returns all cats";
  }

  @Post()
  @HttpCode(204)
  @Header("Cache-Control", "no-store")
  create(): string {
    return "This action adds a new cat";
  }

  @Get("ab*cd")
  findWildCard() {
    return "This route uses a wildcard";
  }

  @Get("docs")
  @Redirect("https://docs.nestjs.com", 302)
  getDocs(@Query("version") version: string) {
    if (version && version === "5") {
      return { url: "https://docs.nestjs.com/v5/" };
    }
  }

  @Get(":id")
  findOne(@Param() params: any): string {
    console.log(params.id);
    return `This action returns a #${params.id} cat`;
  }

  @Get(":id")
  findOneDirectly(@Param("id") id: string): string {
    return `This action returns a #${id} cat`;
  }

  @Get()
  findAllStream(): Observable<any[]> {
    return of([]);
  }

  @Post()
  async createCat(@Body() createCatDto: CreateCatDto) {
    return "This action adds a new cat";
  }

  @Post()
  createLibSpec(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAllLibSpec(@Res() res: Response) {
    res.status(HttpStatus.OK).json([]);
  }

  @Get()
  findAllUseLibSpec(@Res({ passthrough: true }) res: Response) {
    res.status(HttpStatus.OK);
    return [];
  }
}
```

## Key Features

### Subdomain Routing

The `@Controller` decorator can take a host option to require that the HTTP host of the incoming requests matches a specific value. Note that when using sub-domain routing, the Express adapter should be used instead of Fastify, as Fastify lacks support for nested routers.

### Response Handling

Nest provides two different ways to handle responses:

1. **Built-in Method**:

   - JavaScript objects/arrays are automatically serialized to JSON
   - Primitive types are sent as-is
   - Default status codes: 200 for most requests, 201 for POST
   - Can be modified using `@HttpCode(...)` decorator

2. **Library-specific Response**:
   - Uses library-specific response object (e.g., Express)
   - Injected using `@Res()` decorator
   - Allows native response handling methods
   - Example: `response.status(200).send()`

### Route Parameters

For dynamic routes (e.g., `GET /cats/1`), use route parameter tokens:

```typescript
@Get(':id')
findOne(@Param('id') id: string): string {
  return `This action returns a #${id} cat`;
}
```

### Data Transfer Objects (DTOs)

When handling POST requests, it's recommended to use classes for defining DTOs instead of interfaces. This is because:

- Classes are preserved in compiled JavaScript
- TypeScript interfaces are removed during transpilation
- Classes allow Nest to access metatype information at runtime
- Enables additional features like Pipes

### Important Notes

1. When using `@Res()` or `@Next()`, the Standard approach is automatically disabled for that route.

2. To use both approaches simultaneously:

   - Set `passthrough: true` in the `@Res()` decorator
   - Example: `@Res({ passthrough: true })`

3. Routes with parameters should be declared after static paths to prevent intercepting traffic.

4. Wildcard routes (e.g., 'ab\*cd') support:
   - Characters ?, +, \*, and ()
   - Hyphens and dots are interpreted literally
   - Middle-route wildcards only supported by Express

# NestJS Module Documentation

## Overview

A module in NestJS is a class annotated with the `@Module()` decorator. This decorator provides metadata that Nest uses to organize the application structure. Every NestJS application requires at least one module - the root module, which serves as the starting point for building the application graph.

## Module Structure

```typescript
import { Module } from "@nestjs/common";

@Module({
  providers: [], // Providers instantiated by Nest injector
  controllers: [], // Controllers defined in this module
  imports: [], // Imported modules that export required providers
  exports: [], // Providers available to other importing modules
})
export class DogsModule {}
```

## Module Properties

### providers

- Providers that will be instantiated by the Nest injector
- Can be shared across the module
- Managed by the dependency injection system

### controllers

- Set of controllers defined in this module
- Must be instantiated within the module

### imports

- List of imported modules
- These modules export providers required by the current module

### exports

- Subset of providers from this module
- Made available to other modules that import this module
- Can export either the provider itself or its token (provide value)

## Key Concepts

### Module Encapsulation

- Modules encapsulate providers by default
- Cannot inject providers that are not:
  - Directly part of the current module
  - Exported from imported modules
- Exported providers act as the module's public interface/API

### Shared Modules

- All modules in Nest are singletons by default
- Can share provider instances between multiple modules
- Once created, can be reused by any module

Example scenario with `CatsService`:

- When exported from `CatsModule`, all importing modules share the same instance
- Direct registration in multiple modules would create separate instances, leading to:
  - Increased memory usage
  - Potential state inconsistency
  - Unpredictable behavior

### Module Re-exporting

Modules can re-export modules they import. Example:

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

## Best Practices

1. **Modular Organization**

   - While small applications could theoretically use just the root module
   - Recommended to organize components into multiple modules
   - Each module should encapsulate related capabilities

2. **Efficient Sharing**

   - Use module exports to share providers
   - Avoid registering the same provider in multiple modules
   - Leverage the singleton nature of modules

3. **State Management**
   - Use shared modules for consistent state management
   - Ensure predictable behavior across the application
   - Optimize memory usage through proper module organization

## Benefits

- Efficient resource sharing
- Predictable state management
- Reduced memory consumption
- Clear application structure
- Better organization of components
- Easier dependency management

# NestJS Advanced Module Concepts

## Feature Modules

Feature modules organize code for specific features, helping maintain clear boundaries and manage complexity. They support SOLID principles and become increasingly valuable as applications and teams grow.

```typescript
import { Global, Module } from "@nestjs/common";
import { CatsController } from "./_2controller";
import { CatsService } from "./_service";

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
```

**Note**: While modules can inject providers, module classes themselves cannot be injected as providers due to circular dependency concerns.

## Global Modules

### Understanding Global Scope

Unlike Angular where providers are registered globally, NestJS encapsulates providers within module scope. To use a module's providers elsewhere, you must import the encapsulating module.

### Using @Global()

- Makes a module global-scoped
- Should be registered only once (typically in root or core module)
- Providers become available everywhere without importing the module

```typescript
@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

**Important**: Making modules global should be used sparingly. It's generally better to explicitly import modules where needed.

## Dynamic Modules

Dynamic modules allow creation of customizable modules that can register and configure providers dynamically.

### Basic Dynamic Module Example

```typescript
import { Module, DynamicModule } from "@nestjs/common";
import { createDatabaseProviders } from "./database.providers";
import { Connection } from "./connection.provider";

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);

    return {
      global: true,
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

### Key Features

- Can return modules synchronously or asynchronously (via Promise)
- Extends (not overrides) base module metadata
- Can be registered globally using `global: true`
- Allows dynamic provider registration based on configuration

### Using Dynamic Modules

Basic Usage:

```typescript
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { User } from "./users/entities/user.entity";

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

Re-exporting Dynamic Modules:

```typescript
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { User } from "./users/entities/user.entity";

@Module({
  imports: [DatabaseModule.forRoot([User])],
  exports: [DatabaseModule],
})
export class AppModule {}
```

## Best Practices

1. **Module Organization**

   - Use feature modules to organize related code
   - Maintain clear boundaries between different features
   - Follow SOLID principles

2. **Global Modules**

   - Use sparingly
   - Best for truly application-wide services
   - Consider explicit imports as the default approach

3. **Dynamic Modules**

   - Use for configurable, reusable modules
   - Keep configuration options clear and documented
   - Consider whether global registration is necessary

4. **Module Re-exporting**
   - Can re-export both static and dynamic modules
   - Useful for creating public module APIs
   - Helps maintain clean module boundaries

## Common Use Cases

1. **Feature Modules**

   - Domain-specific features
   - Related functionality grouping
   - Team ownership boundaries

2. **Global Modules**

   - Configuration services
   - Database connections
   - Logging services
   - Common utilities

3. **Dynamic Modules**
   - Database configuration
   - External service integration
   - Feature toggles
   - Environment-specific setups

# NestJS Core Concepts Guide

## Application Bootstrap

The entry point of a NestJS application uses `NestFactory` to create the application instance:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./_module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## Controllers

Controllers handle incoming requests and return responses to the client.

```typescript
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

## Middleware

Middleware functions run before route handlers and have access to request and response objects.

### Class-based Middleware

```typescript
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log("Request...");
    next();
  }
}
```

### Functional Middleware

```typescript
export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
}
```

### Applying Middleware

```typescript
@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: "cats", method: RequestMethod.GET }, "cats/(.*)")
      .forRoutes(CatsController);
  }
}
```

### Global Middleware

```typescript
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(3000);
```

## Providers

Providers are the foundation for dependency injection in NestJS.

### Basic Provider

```typescript
@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
```

### Optional Providers

```typescript
@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject("HTTP_OPTIONS") private httpClient: T) {}
}
```

### Property-based Injection

```typescript
@Injectable()
export class PropBaseInjectService<T> {
  @Inject("HTTP_OPTIONS")
  private readonly httpClient: T;
}
```

## Module Configuration

Modules organize the application structure:

```typescript
@Module({
  imports: [DogsModule, CatsModule],
  controllers: [AppController, CatsController],
  providers: [AppService, CatsService],
})
export class AppModule {}
```

## Best Practices

1. **Controllers**

   - Should handle HTTP requests
   - Delegate complex tasks to providers
   - Keep logic minimal

2. **Middleware**

   - Use functional middleware when no dependencies needed
   - Apply middleware globally when needed for all routes
   - Use exclude() to fine-tune middleware application

3. **Providers**

   - Prefer constructor-based injection over property-based
   - Use @Optional() for optional dependencies
   - Maintain single responsibility principle

4. **Dependency Injection**
   - Let NestJS handle instantiation when possible
   - Use custom providers for complex scenarios
   - Consider provider scope (singleton vs request-scoped)

## Important Notes

1. **Middleware Execution**

   - Must call next() unless ending request-response cycle
   - Executes before route handlers
   - Can modify request and response objects

2. **Provider Lifecycle**

   - Typically synchronized with application lifecycle
   - Can be made request-scoped if needed
   - Destroyed when application shuts down

3. **Dependency Resolution**
   - Handled automatically by NestJS IoC container
   - Can be manually instantiated when needed
   - Supports various provider types (values, classes, factories)
