"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./express");
const sofa_1 = require("./sofa");
exports.createSofa = sofa_1.createSofa;
var open_api_1 = require("./open-api");
exports.OpenAPI = open_api_1.OpenAPI;
function useSofa(config) {
    return express_1.createRouter(sofa_1.createSofa(config));
}
exports.useSofa = useSofa;
exports.default = useSofa;
//# sourceMappingURL=index.js.map