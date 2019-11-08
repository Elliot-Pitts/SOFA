"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mapToPrimitive(type) {
    const formatMap = {
        Int: {
            type: 'integer',
            format: 'int32',
        },
        Float: {
            type: 'number',
            format: 'float',
        },
        String: {
            type: 'string',
        },
        Boolean: {
            type: 'boolean',
        },
    };
    if (formatMap[type]) {
        return formatMap[type];
    }
}
exports.mapToPrimitive = mapToPrimitive;
function mapToRef(type) {
    return `#/components/schemas/${type}`;
}
exports.mapToRef = mapToRef;
//# sourceMappingURL=utils.js.map