"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
function getOperationInfo(doc) {
    const op = graphql_1.getOperationAST(doc, null);
    if (!op) {
        return;
    }
    return {
        operation: op,
        name: op.name.value,
        variables: op.variableDefinitions || [],
    };
}
exports.getOperationInfo = getOperationInfo;
//# sourceMappingURL=ast.js.map