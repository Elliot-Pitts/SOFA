import * as express from 'express';
import { Sofa } from './sofa';
export declare type ErrorHandler = (res: express.Response, errors: ReadonlyArray<any>) => void;
export declare type ExpressMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
export declare function createRouter(sofa: Sofa): express.Router;
