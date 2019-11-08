"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const changeCase = require("change-case");
function convertName(name) {
    return changeCase.param(name);
}
exports.convertName = convertName;
//# sourceMappingURL=common.js.map