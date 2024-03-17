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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceSave = exports.referenceLoad = void 0;
const lodash_1 = require("lodash");
const protect_1 = __importDefault(require("./protect"));
const getResource = (scope) => {
    var _a, _b, _c, _d, _e;
    const { component } = scope;
    const resourceId = (_a = component.data) === null || _a === void 0 ? void 0 : _a.resource;
    let resource = (_b = scope.server) === null || _b === void 0 ? void 0 : _b.project.forms[resourceId];
    if (!resource) {
        for (let name in (_c = scope.server) === null || _c === void 0 ? void 0 : _c.project.forms) {
            const form = (_d = scope.server) === null || _d === void 0 ? void 0 : _d.project.forms[name].clientForm;
            if (form._id.toString() === resourceId) {
                resource = (_e = scope.server) === null || _e === void 0 ? void 0 : _e.project.forms[name];
                break;
            }
        }
    }
    return resource;
};
const referenceLoad = (scope) => __awaiter(void 0, void 0, void 0, function* () {
    const { component, data, value, path } = scope;
    if (!value) {
        return;
    }
    if (component.reference) {
        const resource = getResource(scope);
        if (resource) {
            const submission = yield resource.loadSubmission(value._id);
            if (submission) {
                // Make sure to protect this submission like any other submission output.
                const context = Object.assign(Object.assign({}, scope), { data: {} });
                yield scope.utils.eachComponentDataAsync(resource.clientForm.components, submission.data, (comp, compData, compRow, compPath) => __awaiter(void 0, void 0, void 0, function* () {
                    yield (0, protect_1.default)(Object.assign(Object.assign({}, context), { component: comp, row: compRow, data: compData, value: (0, lodash_1.get)(compRow, comp.key), path: compPath }));
                }));
                submission.data = context.data;
                (0, lodash_1.set)(data, path, submission);
            }
        }
    }
});
exports.referenceLoad = referenceLoad;
const referenceSave = (scope) => __awaiter(void 0, void 0, void 0, function* () {
    const { component, data, value, path } = scope;
    if (!value || !value._id) {
        return;
    }
    if (component.reference && value._id) {
        const resource = getResource(scope);
        if (resource) {
            (0, lodash_1.set)(data, path, {
                _id: value._id,
                form: resource.clientForm._id
            });
        }
    }
});
exports.referenceSave = referenceSave;
