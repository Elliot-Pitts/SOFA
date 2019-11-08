"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const graphql_1 = require("graphql");
const operation_1 = require("./operation");
const ast_1 = require("./ast");
const sofa_1 = require("./sofa");
const common_1 = require("./common");
const parse_1 = require("./parse");
const subscriptions_1 = require("./subscriptions");
const logger_1 = require("./logger");
function createRouter(sofa) {
    logger_1.logger.debug('[Sofa] Creating router');
    const router = express.Router();
    const queryType = sofa.schema.getQueryType();
    const mutationType = sofa.schema.getMutationType();
    const subscriptionManager = new subscriptions_1.SubscriptionManager(sofa);
    if (queryType) {
        Object.keys(queryType.getFields()).forEach(fieldName => {
            const route = createQueryRoute({ sofa, router, fieldName });
            if (sofa.onRoute) {
                sofa.onRoute(route);
            }
        });
    }
    if (mutationType) {
        Object.keys(mutationType.getFields()).forEach(fieldName => {
            const route = createMutationRoute({ sofa, router, fieldName });
            if (sofa.onRoute) {
                sofa.onRoute(route);
            }
        });
    }
    router.post('/webhook', useAsync((req, res) => __awaiter(this, void 0, void 0, function* () {
        const { subscription, variables, url } = req.body;
        try {
            const result = yield subscriptionManager.start({
                subscription,
                variables,
                url,
            }, { req, res });
            res.statusCode = 200;
            res.statusMessage = 'OK';
            res.json(result);
        }
        catch (e) {
            console.log(e);
            res.statusCode = 500;
            res.statusMessage = 'Subscription failed';
            res.json(e);
        }
    })));
    router.post('/webhook/:id', useAsync((req, res) => __awaiter(this, void 0, void 0, function* () {
        const id = req.params.id;
        const variables = req.body.variables;
        try {
            const result = yield subscriptionManager.update({
                id,
                variables,
            }, {
                req,
                res,
            });
            res.statusCode = 200;
            res.statusMessage = 'OK';
            res.json(result);
        }
        catch (e) {
            console.log(e);
            res.statusCode = 500;
            res.statusMessage = 'Subscription failed to update';
            res.json(e);
        }
    })));
    router.delete('/webhook/:id', useAsync((req, res) => __awaiter(this, void 0, void 0, function* () {
        const id = req.params.id;
        try {
            const result = yield subscriptionManager.stop(id);
            res.statusCode = 200;
            res.statusMessage = 'OK';
            res.json(result);
        }
        catch (e) {
            console.log(e);
            res.statusCode = 500;
            res.statusMessage = 'Subscription failed to stop';
            res.json(e);
        }
    })));
    return router;
}
exports.createRouter = createRouter;
function createQueryRoute({ sofa, router, fieldName, }) {
    logger_1.logger.debug(`[Router] Creating ${fieldName} query`);
    const queryType = sofa.schema.getQueryType();
    const operation = operation_1.buildOperation({
        kind: 'query',
        schema: sofa.schema,
        field: fieldName,
        models: sofa.models,
        ignore: sofa.ignore,
    });
    const info = ast_1.getOperationInfo(operation);
    const field = queryType.getFields()[fieldName];
    const fieldType = field.type;
    const isSingle = graphql_1.isObjectType(fieldType) ||
        (graphql_1.isNonNullType(fieldType) && graphql_1.isObjectType(fieldType.ofType));
    const hasIdArgument = field.args.some(arg => arg.name === 'id');
    const path = getPath(fieldName, isSingle && hasIdArgument);
    const method = produceMethod({
        typeName: queryType.name,
        fieldName,
        methodMap: sofa.method,
        defaultValue: 'GET',
    });
    router[method.toLocaleLowerCase()](path, useHandler({ info, fieldName, sofa, operation }));
    logger_1.logger.debug(`[Router] ${fieldName} query available at ${method} ${path}`);
    return {
        document: operation,
        path,
        method: method.toUpperCase(),
    };
}
function createMutationRoute({ sofa, router, fieldName, }) {
    logger_1.logger.debug(`[Router] Creating ${fieldName} mutation`);
    const mutationType = sofa.schema.getMutationType();
    const operation = operation_1.buildOperation({
        kind: 'mutation',
        schema: sofa.schema,
        field: fieldName,
        models: sofa.models,
        ignore: sofa.ignore,
    });
    const info = ast_1.getOperationInfo(operation);
    const path = getPath(fieldName);
    const method = produceMethod({
        typeName: mutationType.name,
        fieldName,
        methodMap: sofa.method,
        defaultValue: 'POST',
    });
    router[method.toLowerCase()](path, useHandler({ info, fieldName, sofa, operation }));
    logger_1.logger.debug(`[Router] ${fieldName} mutation available at ${method} ${path}`);
    return {
        document: operation,
        path,
        method: method.toUpperCase(),
    };
}
function useHandler(config) {
    const { sofa, operation, fieldName } = config;
    const info = config.info;
    return useAsync((req, res) => __awaiter(this, void 0, void 0, function* () {
        const variableValues = info.variables.reduce((variables, variable) => {
            const name = variable.variable.name.value;
            const value = parse_1.parseVariable({
                value: pickParam(req, name),
                variable,
                schema: sofa.schema,
            });
            if (typeof value === 'undefined') {
                return variables;
            }
            return Object.assign(Object.assign({}, variables), { [name]: value });
        }, {});
        const contextValue = sofa_1.isContextFn(sofa.context)
            ? yield sofa.context({ req, res })
            : sofa.context;
        const result = yield sofa.execute({
            schema: sofa.schema,
            source: graphql_1.print(operation),
            contextValue,
            variableValues,
            operationName: info.operation.name && info.operation.name.value,
        });
        if (result.errors) {
            const defaultErrorHandler = (res, errors) => {
                res.status(500);
                res.json(errors[0]);
            };
            const errorHandler = sofa.errorHandler || defaultErrorHandler;
            errorHandler(res, result.errors);
            return;
        }
        res.json(result.data && result.data[fieldName]);
    }));
}
function getPath(fieldName, hasId = false) {
    return `/${common_1.convertName(fieldName)}${hasId ? '/:id' : ''}`;
}
function pickParam(req, name) {
    if (req.params && req.params.hasOwnProperty(name)) {
        return req.params[name];
    }
    if (req.query && req.query.hasOwnProperty(name)) {
        return req.query[name];
    }
    if (req.body && req.body.hasOwnProperty(name)) {
        return req.body[name];
    }
}
function useAsync(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(e => {
            console.log(e);
            next(e);
        });
    };
}
function produceMethod({ typeName, fieldName, methodMap, defaultValue, }) {
    const path = `${typeName}.${fieldName}`;
    if (methodMap && methodMap[path]) {
        return methodMap[path];
    }
    return defaultValue;
}
//# sourceMappingURL=express.js.map