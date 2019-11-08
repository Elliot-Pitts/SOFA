"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const common_1 = require("./common");
const logger_1 = require("./logger");
function createSofa(config) {
    logger_1.logger.debug('[Sofa] Created');
    const models = extractsModels(config.schema);
    const ignore = config.ignore || [];
    logger_1.logger.debug(`[Sofa] models: ${models.join(', ')}`);
    logger_1.logger.debug(`[Sofa] ignore: ${ignore.join(', ')}`);
    return Object.assign({ context({ req }) {
            return { req };
        }, execute: graphql_1.graphql, models,
        ignore }, config);
}
exports.createSofa = createSofa;
// Objects and Unions are the only things that are used to define return types
// and both might contain an ID
// We don't treat Unions as models because
// they might represent an Object that is not a model
// We check it later, when an operation is being built
function extractsModels(schema) {
    const modelMap = {};
    const query = schema.getQueryType();
    const fields = query.getFields();
    // if Query[type] (no args) and Query[type](just id as an argument)
    // loop through every field
    for (const fieldName in fields) {
        const field = fields[fieldName];
        const namedType = graphql_1.getNamedType(field.type);
        if (hasID(namedType)) {
            if (!modelMap[namedType.name]) {
                modelMap[namedType.name] = {};
            }
            if (isArrayOf(field.type, namedType)) {
                // check if type is a list
                // check if name of a field matches a name of a named type (in plural)
                // check if has no non-optional arguments
                // add to registry with `list: true`
                const sameName = isNameEqual(field.name, namedType.name + 's');
                const allOptionalArguments = !field.args.some(arg => graphql_1.isNonNullType(arg.type));
                modelMap[namedType.name].list = sameName && allOptionalArguments;
            }
            else if (graphql_1.isObjectType(field.type) ||
                (graphql_1.isNonNullType(field.type) && graphql_1.isObjectType(field.type.ofType))) {
                // check if type is a graphql object type
                // check if name of a field matches with name of an object type
                // check if has only one argument named `id`
                // add to registry with `single: true`
                const sameName = isNameEqual(field.name, namedType.name);
                const hasIdArgument = field.args.length === 1 && field.args[0].name === 'id';
                modelMap[namedType.name].single = sameName && hasIdArgument;
            }
        }
    }
    return Object.keys(modelMap).filter(name => modelMap[name].list && modelMap[name].single);
}
// it's dumb but let's leave it for now
function isArrayOf(type, expected) {
    if (isOptionalList(type)) {
        return true;
    }
    if (graphql_1.isNonNullType(type) && isOptionalList(type.ofType)) {
        return true;
    }
    function isOptionalList(list) {
        if (graphql_1.isListType(list)) {
            if (list.ofType.name === expected.name) {
                return true;
            }
            if (graphql_1.isNonNullType(list.ofType) &&
                list.ofType.ofType.name === expected.name) {
                return true;
            }
        }
    }
    return false;
}
function hasID(type) {
    return graphql_1.isObjectType(type) && !!type.getFields().id;
}
function isNameEqual(a, b) {
    return common_1.convertName(a) === common_1.convertName(b);
}
function isContextFn(context) {
    return typeof context === 'function';
}
exports.isContextFn = isContextFn;
//# sourceMappingURL=sofa.js.map