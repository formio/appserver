"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = exports.Auth = exports.Database = exports.Prepper = exports.Server = exports.Modules = void 0;
// Load the license key.
const fs_1 = __importDefault(require("fs"));
const get_1 = __importDefault(require("lodash/get"));
let licenseKey = (0, get_1.default)(process.env, 'LICENSE_KEY', '');
if (!licenseKey) {
    try {
        licenseKey = fs_1.default.readFileSync(path_1.default.join((0, process_1.cwd)(), 'license.txt'), 'utf8');
    }
    catch (err) {
        console.log('No license key found. Please set the LICENSE_KEY environment variable or create a license.txt file in the root of the project.');
    }
}
const appserver_core_1 = require("@formio/appserver-core");
const modules_1 = require("./modules");
Object.defineProperty(exports, "Database", { enumerable: true, get: function () { return modules_1.Database; } });
Object.defineProperty(exports, "Auth", { enumerable: true, get: function () { return modules_1.Auth; } });
const actions_1 = __importDefault(require("./actions"));
exports.Actions = actions_1.default;
const prepare_1 = require("./prepare");
Object.defineProperty(exports, "Prepper", { enumerable: true, get: function () { return prepare_1.Prepper; } });
const process_1 = require("process");
const path_1 = __importDefault(require("path"));
const defaultsDeep_1 = __importDefault(require("lodash/defaultsDeep"));
const core_1 = require("@formio/core");
const packageJson = require('../package.json');
const appCorePackage = require('@formio/appserver-core/package.json');
const corePackage = require('@formio/core');
exports.Modules = {
    db: modules_1.Database,
    auth: modules_1.Auth,
    processors: core_1.ProcessTargets,
    prepper: prepare_1.Prepper,
    actions: actions_1.default
};
class Server extends appserver_core_1.Server {
    constructor(config = {}) {
        if (config.processors) {
            exports.Modules.processors = config.processors;
        }
        if (config.preppers) {
            exports.Modules.prepper.preppers = config.preppers;
        }
        if (!config.actions) {
            config.actions = {};
        }
        super({
            db: config.db || new exports.Modules.db({
                url: (0, get_1.default)(process.env, 'MONGO', "mongodb://localhost:27017/appserver"),
                config: (0, get_1.default)(process.env, 'MONGO_CONFIG', "{}")
            }),
            processors: exports.Modules.processors,
            prepper: exports.Modules.prepper,
            auth: config.auth || new exports.Modules.auth(),
            actions: Object.assign(Object.assign({}, exports.Modules.actions), config.actions),
            config: (0, defaultsDeep_1.default)(config.config || {}, {
                license: licenseKey,
                cache: ((0, get_1.default)(process.env, 'PROJECT_CACHE', true)).toString() === 'true',
                status: {
                    version: '8.0.0',
                    '@formio/appserver': packageJson.version,
                    '@formio/appserver-core': appCorePackage.version,
                    '@formio/core': corePackage.version
                },
                auth: {
                    portal: (0, get_1.default)(process.env, 'PORTAL_SECRET', ''),
                    secret: (0, get_1.default)(process.env, 'JWT_SECRET', ''),
                    expire: (0, get_1.default)(process.env, 'JWT_EXPIRE_TIME', 240)
                },
                project: {
                    url: (0, get_1.default)(process.env, 'PROJECT_ENDPOINT', ''),
                    key: (0, get_1.default)(process.env, 'PROJECT_KEY', '')
                }
            }),
            hooks: config.hooks || {}
        });
    }
}
exports.Server = Server;
