import { GraphQLSchema } from 'graphql';
import { RouteInfo } from '../types';
export declare function OpenAPI({ schema, info, }: {
    schema: GraphQLSchema;
    info: Record<string, any>;
}): {
    addRoute(info: RouteInfo, config?: {
        basePath?: string | undefined;
    } | undefined): void;
    get(): any;
    save(filepath: string): void;
};
