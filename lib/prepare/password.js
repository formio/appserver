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
const get_1 = __importDefault(require("lodash/get"));
const set_1 = __importDefault(require("lodash/set"));
exports.default = (scope) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if they do not provide a password in the save, but one exists in the current record.
    // Do not allow them to wipe out their password by saving data that does not include one.
    const { type, component, row, current, path, data } = scope;
    if (component.type === 'password' && type === 'save') {
        const currentPass = (0, get_1.default)(current, `data.${path}`);
        if (!(0, get_1.default)(row, component.key) && currentPass) {
            (0, set_1.default)(data, path, currentPass);
        }
    }
});
