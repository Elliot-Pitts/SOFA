import { GraphQLSchema } from 'graphql';
import { Ignore, Context, ContextFn, ExecuteFn, OnRoute, MethodMap } from './types';
import { ErrorHandler } from './express';
export interface SofaConfig {
    schema: GraphQLSchema;
    context?: Context;
    execute?: ExecuteFn;
    /**
     * Treats an Object with an ID as not a model.
     * @example ["User", "Message.author"]
     */
    ignore?: Ignore;
    onRoute?: OnRoute;
    depthLimit?: number;
    errorHandler?: ErrorHandler;
    /**
     * Overwrites the default HTTP method.
     * @example {"Query.field": "GET", "Mutation.field": "POST"}
     */
    method?: MethodMap;
}
export interface Sofa {
    schema: GraphQLSchema;
    context: Context;
    models: string[];
    ignore: Ignore;
    method?: MethodMap;
    execute: ExecuteFn;
    onRoute?: OnRoute;
    errorHandler?: ErrorHandler;
}
export declare function createSofa(config: SofaConfig): Sofa;
export declare function isContextFn(context: any): context is ContextFn;
