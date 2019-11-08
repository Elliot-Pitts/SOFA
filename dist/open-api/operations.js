"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const ast_1 = require("../ast");
const utils_1 = require("./utils");
const types_1 = require("./types");
const titleCase = require("title-case");
function buildPathFromOperation({ url, schema, operation, useRequestBody, }) {
    const info = ast_1.getOperationInfo(operation);
    const description = resolveDescription(schema, info.operation);
    return Object.assign(Object.assign({ operationId: info.name }, (useRequestBody
        ? {
            requestBody: {
                content: {
                    'application/json': {
                        schema: resolveRequestBody(info.operation.variableDefinitions),
                    },
                },
            },
        }
        : {
            parameters: resolveParameters(url, info.operation.variableDefinitions),
        })), { responses: {
            200: {
                description,
                content: {
                    'application/json': {
                        schema: resolveResponse({
                            schema,
                            operation: info.operation,
                        }),
                    },
                },
            },
        } });
}
exports.buildPathFromOperation = buildPathFromOperation;
function resolveParameters(url, variables) {
    if (!variables) {
        return [];
    }
    return variables.map((variable) => {
        return {
            in: isInPath(url, variable.variable.name.value) ? 'path' : 'query',
            name: variable.variable.name.value,
            required: variable.type.kind === 'NonNullType',
            schema: resolveParamSchema(variable.type),
        };
    });
}
function resolveRequestBody(variables) {
    if (!variables) {
        return {};
    }
    const properties = {};
    const required = [];
    variables.forEach(variable => {
        if (variable.type.kind === 'NonNullType') {
            required.push(variable.variable.name.value);
        }
        properties[variable.variable.name.value] = resolveParamSchema(variable.type);
    });
    return Object.assign({ type: 'object', properties }, (required.length ? { required } : {}));
}
// array -> [type]
// type -> $ref
// scalar -> swagger primitive
function resolveParamSchema(type) {
    if (type.kind === 'NonNullType') {
        return resolveParamSchema(type.type);
    }
    if (type.kind === 'ListType') {
        return {
            type: 'array',
            items: resolveParamSchema(type.type),
        };
    }
    const primitive = utils_1.mapToPrimitive(type.name.value);
    return (primitive || {
        $ref: utils_1.mapToRef(type.name.value),
    });
}
function resolveResponse({ schema, operation, }) {
    const operationType = operation.operation;
    const rootField = operation.selectionSet.selections[0];
    if (rootField.kind === 'Field') {
        if (operationType === 'query') {
            const queryType = schema.getQueryType();
            const field = queryType.getFields()[rootField.name.value];
            return types_1.resolveFieldType(field.type);
        }
        if (operationType === 'mutation') {
            const mutationType = schema.getMutationType();
            const field = mutationType.getFields()[rootField.name.value];
            return types_1.resolveFieldType(field.type);
        }
    }
}
function isInPath(url, param) {
    return url.indexOf(`{${param}}`) !== -1;
}
function resolveDescription(schema, operation) {
    const selection = operation.selectionSet.selections[0];
    const fieldName = selection.name.value;
    const typeDefinition = schema.getType(titleCase(operation.operation));
    if (!typeDefinition) {
        return '';
    }
    const definitionNode = typeDefinition.astNode || graphql_1.parse(graphql_1.printType(typeDefinition)).definitions[0];
    if (!isObjectTypeDefinitionNode(definitionNode)) {
        return '';
    }
    const fieldNode = definitionNode.fields.find(field => field.name.value === fieldName);
    const descriptionDefinition = fieldNode && fieldNode.description;
    return descriptionDefinition && descriptionDefinition.value
        ? descriptionDefinition.value
        : '';
}
function isObjectTypeDefinitionNode(node) {
    return node.kind === 'ObjectTypeDefinition';
}
//# sourceMappingURL=operations.js.map