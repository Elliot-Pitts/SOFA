import { GraphQLSchema, DocumentNode, OperationTypeNode } from 'graphql';
import { Ignore } from './types';
export declare type Skip = string[];
export declare type Force = string[];
export declare function buildOperation({ schema, kind, field, models, ignore, depthLimit, }: {
    schema: GraphQLSchema;
    kind: OperationTypeNode;
    field: string;
    models: string[];
    ignore: Ignore;
    depthLimit?: number;
}): DocumentNode;
