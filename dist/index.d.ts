import * as express from 'express';
import { SofaConfig, createSofa } from './sofa';
export { OpenAPI } from './open-api';
declare function useSofa(config: SofaConfig): express.Router;
export { useSofa, createSofa };
export default useSofa;
