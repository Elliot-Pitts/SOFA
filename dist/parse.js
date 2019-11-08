"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
function parseVariable({ value, variable, schema, }) {
    if (value !== undefined && value !== null) {
        return resolveVariable({
            value,
            type: variable.type,
            schema,
        });
    }
    return;
}
exports.parseVariable = parseVariable;
function resolveVariable({ value, type, schema, }) {
    if (type.kind === 'NamedType') {
        const namedType = schema.getType(type.name.value);
        if (graphql_1.isScalarType(namedType)) {
            // GraphQLBoolean.serialize expects a boolean or a number only
            if (graphql_1.isEqualType(graphql_1.GraphQLBoolean, namedType)) {
                // we don't support TRUE
                value = value === 'true';
            }
            return namedType.serialize(value);
        }
        if (graphql_1.isInputObjectType(namedType)) {
            return value && typeof value === 'object' ? value : JSON.parse(value);
        }
        return value;
    }
    if (type.kind === 'ListType') {
        return value.map(val => resolveVariable({
            value: val,
            type: type.type,
            schema,
        }));
    }
    if (type.kind === 'NonNullType') {
        return resolveVariable({
            value: value,
            type: type.type,
            schema,
        });
    }
}
//# sourceMappingURL=parse.js.map