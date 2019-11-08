"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const YAML = require("yamljs");
const fs_1 = require("fs");
const types_1 = require("./types");
const operations_1 = require("./operations");
function OpenAPI({ schema, info, }) {
    const types = schema.getTypeMap();
    const swagger = {
        openapi: '3.0.0',
        info,
        paths: {},
        components: {
            schemas: {},
        },
    };
    for (const typeName in types) {
        const type = types[typeName];
        if ((graphql_1.isObjectType(type) || graphql_1.isInputObjectType(type)) &&
            !graphql_1.isIntrospectionType(type)) {
            swagger.components.schemas[typeName] = types_1.buildSchemaObjectFromType(type);
        }
    }
    return {
        addRoute(info, config) {
            const basePath = (config && config.basePath) || '';
            const path = basePath +
                info.path.replace(/\:[a-z0-9]+\w/i, param => `{${param.replace(':', '')}}`);
            if (!swagger.paths[path]) {
                swagger.paths[path] = {};
            }
            swagger.paths[path][info.method.toLowerCase()] = operations_1.buildPathFromOperation({
                url: path,
                operation: info.document,
                schema,
                useRequestBody: ['POST', 'PUT', 'PATCH'].includes(info.method),
            });
            swagger.components.schemas.ID = {
                type: 'string',
            };
        },
        get() {
            return swagger;
        },
        save(filepath) {
            const isJSON = /\.json$/i;
            const isYAML = /.ya?ml$/i;
            if (isJSON.test(filepath)) {
                writeOutput(filepath, JSON.stringify(swagger, null, 2));
            }
            else if (isYAML.test(filepath)) {
                writeOutput(filepath, YAML.stringify(swagger, Infinity));
            }
            else {
                throw new Error('We only support JSON and YAML files');
            }
        },
    };
}
exports.OpenAPI = OpenAPI;
function writeOutput(filepath, contents) {
    fs_1.writeFileSync(filepath, contents, {
        encoding: 'utf-8',
    });
}
//# sourceMappingURL=index.js.map