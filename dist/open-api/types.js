"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const utils_1 = require("./utils");
function buildSchemaObjectFromType(type) {
    const required = [];
    const properties = {};
    const fields = type.getFields();
    for (const fieldName in fields) {
        const field = fields[fieldName];
        if (graphql_1.isNonNullType(field.type)) {
            required.push(field.name);
        }
        properties[fieldName] = resolveField(field);
        if (field.description) {
            properties[fieldName].description = field.description;
        }
    }
    return Object.assign(Object.assign(Object.assign({ type: 'object' }, (required.length ? { required } : {})), { properties }), (type.description ? { description: type.description } : {}));
}
exports.buildSchemaObjectFromType = buildSchemaObjectFromType;
function resolveField(field) {
    return resolveFieldType(field.type);
}
// array -> [type]
// type -> $ref
// scalar -> swagger primitive
function resolveFieldType(type) {
    if (graphql_1.isNonNullType(type)) {
        return resolveFieldType(type.ofType);
    }
    if (graphql_1.isListType(type)) {
        return {
            type: 'array',
            items: resolveFieldType(type.ofType),
        };
    }
    if (graphql_1.isObjectType(type)) {
        return {
            $ref: utils_1.mapToRef(type.name),
        };
    }
    if (graphql_1.isScalarType(type)) {
        return (utils_1.mapToPrimitive(type.name) || {
            type: 'object',
        });
    }
    return {
        type: 'object',
    };
}
exports.resolveFieldType = resolveFieldType;
//# sourceMappingURL=types.js.map