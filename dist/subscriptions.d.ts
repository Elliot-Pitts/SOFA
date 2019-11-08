import { ExecutionResult } from 'graphql';
import { Sofa } from './sofa';
export declare type ID = string;
export declare type SubscriptionFieldName = string;
export interface StartSubscriptionEvent {
    subscription: SubscriptionFieldName;
    variables: any;
    url: string;
}
export interface UpdateSubscriptionEvent {
    id: ID;
    variables: any;
}
export interface StopSubscriptionResponse {
    id: ID;
}
export declare class SubscriptionManager {
    private sofa;
    private operations;
    private clients;
    constructor(sofa: Sofa);
    start(event: StartSubscriptionEvent, { req, res, }: {
        req: any;
        res: any;
    }): Promise<ExecutionResult<any> | {
        id: string;
    }>;
    stop(id: ID): Promise<StopSubscriptionResponse>;
    update(event: UpdateSubscriptionEvent, { req, res, }: {
        req: any;
        res: any;
    }): Promise<ExecutionResult<any> | {
        id: string;
    }>;
    private execute;
    private sendData;
    private buildOperations;
}
