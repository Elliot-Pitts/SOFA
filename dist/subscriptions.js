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
const graphql_1 = require("graphql");
const uuid = require("uuid/v4");
const request = require("request-promise-native");
const iterall_1 = require("iterall");
const operation_1 = require("./operation");
const sofa_1 = require("./sofa");
const ast_1 = require("./ast");
const parse_1 = require("./parse");
const logger_1 = require("./logger");
class SubscriptionManager {
    constructor(sofa) {
        this.sofa = sofa;
        this.operations = new Map();
        this.clients = new Map();
        this.buildOperations();
    }
    start(event, { req, res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = uuid();
            const name = event.subscription;
            if (!this.operations.has(name)) {
                throw new Error(`Subscription '${name}' is not available`);
            }
            const { document, operationName, variables } = this.operations.get(name);
            logger_1.logger.info(`[Subscription] Start ${id}`, event);
            const result = yield this.execute({
                id,
                name,
                url: event.url,
                document,
                operationName,
                variables,
                req,
                res,
            });
            if (typeof result !== 'undefined') {
                return result;
            }
            return { id };
        });
    }
    stop(id) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info(`[Subscription] Stop ${id}`);
            if (!this.clients.has(id)) {
                throw new Error(`Subscription with ID '${id}' does not exist`);
            }
            const execution = this.clients.get(id);
            if (execution.iterator.return) {
                execution.iterator.return();
            }
            this.clients.delete(id);
            return { id };
        });
    }
    update(event, { req, res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { variables, id } = event;
            logger_1.logger.info(`[Subscription] Update ${id}`, event);
            if (!this.clients.has(id)) {
                throw new Error(`Subscription with ID '${id}' does not exist`);
            }
            const { name: subscription, url } = this.clients.get(id);
            this.stop(id);
            return this.start({
                url,
                subscription,
                variables,
            }, {
                req,
                res,
            });
        });
    }
    execute({ id, document, name, url, operationName, variables, req, res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const variableNodes = this.operations.get(name).variables;
            const variableValues = variableNodes.reduce((values, variable) => {
                const value = parse_1.parseVariable({
                    value: variables[variable.variable.name.value],
                    variable,
                    schema: this.sofa.schema,
                });
                if (typeof value === 'undefined') {
                    return values;
                }
                return Object.assign(Object.assign({}, values), { [name]: value });
            }, {});
            const C = sofa_1.isContextFn(this.sofa.context)
                ? yield this.sofa.context({ req, res })
                : this.sofa.context;
            const execution = yield graphql_1.subscribe({
                schema: this.sofa.schema,
                document,
                operationName,
                variableValues,
                contextValue: C,
            });
            if (iterall_1.isAsyncIterable(execution)) {
                // successful
                // add execution to clients
                this.clients.set(id, {
                    name,
                    url,
                    iterator: execution,
                });
                // success
                iterall_1.forAwaitEach(execution, (result) => __awaiter(this, void 0, void 0, function* () {
                    yield this.sendData({
                        id,
                        result,
                    });
                })).then(() => {
                    // completes
                    this.stop(id);
                }, e => {
                    logger_1.logger.info(`Subscription #${id} closed`);
                    console.log(e);
                    this.stop(id);
                });
            }
            else {
                return execution;
            }
        });
    }
    sendData({ id, result }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.clients.has(id)) {
                throw new Error(`Subscription with ID '${id}' does not exist`);
            }
            const { url } = this.clients.get(id);
            logger_1.logger.info(`[Subscription] Trigger ${id}`);
            yield request.post(url, {
                json: result,
            });
        });
    }
    buildOperations() {
        const subscription = this.sofa.schema.getSubscriptionType();
        if (!subscription) {
            return;
        }
        const fieldMap = subscription.getFields();
        for (const field in fieldMap) {
            const document = operation_1.buildOperation({
                kind: 'subscription',
                field,
                schema: this.sofa.schema,
                models: this.sofa.models,
                ignore: this.sofa.ignore,
            });
            const { variables, name: operationName } = ast_1.getOperationInfo(document);
            this.operations.set(field, {
                operationName,
                document,
                variables,
            });
        }
    }
}
exports.SubscriptionManager = SubscriptionManager;
//# sourceMappingURL=subscriptions.js.map