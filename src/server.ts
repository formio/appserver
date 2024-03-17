// Load the license key.
import fs from 'fs';
import get from 'lodash/get';
let licenseKey = get(process.env, 'LICENSE_KEY', '');
if (!licenseKey) {
    try {
        licenseKey = fs.readFileSync(path.join(cwd(), 'license.txt'), 'utf8');
    }
    catch (err) {
        console.log('No license key found. Please set the LICENSE_KEY environment variable or create a license.txt file in the root of the project.');
    }
}

import { Server as CoreServer } from '@formio/appserver-core';
import { Database, Auth } from "./modules";
import Actions from "./actions";
import { Prepper } from './prepare';
import { AppServerScope } from '@formio/appserver-types';
import { cwd } from 'process';
import path from 'path';
import defaultsDeep from 'lodash/defaultsDeep';
import { ProcessTargets } from '@formio/core';
const packageJson = require('../package.json');
const appCorePackage = require('@formio/appserver-core/package.json');
const corePackage = require('@formio/core');

export const Modules = {
    db: Database,
    auth: Auth,
    processors: ProcessTargets,
    prepper: Prepper,
    actions: Actions
};

export class Server extends CoreServer {
    constructor(config: AppServerScope = {}) {
        if (config.processors) {
            Modules.processors = config.processors;
        }
        if (config.preppers) {
            Modules.prepper.preppers = config.preppers;
        }
        if (!config.actions) {
            config.actions = {};
        }
        super({
            db: config.db || new Modules.db({
                url: get(process.env, 'MONGO', "mongodb://localhost:27017/appserver"),
                config: get(process.env, 'MONGO_CONFIG', "{}")
            }),
            processors: Modules.processors,
            prepper: Modules.prepper,
            auth: config.auth || new Modules.auth(),
            actions: {...Modules.actions, ...config.actions},
            config: defaultsDeep(config.config || {}, {
                license: licenseKey,
                cache: (get(process.env, 'PROJECT_CACHE', true)).toString() === 'true',
                status: {
                    version: '8.0.0',
                    '@formio/appserver': packageJson.version,
                    '@formio/appserver-core': appCorePackage.version,
                    '@formio/core': corePackage.version
                },
                auth: {
                    portal: get(process.env, 'PORTAL_SECRET', ''),
                    secret: get(process.env, 'JWT_SECRET', ''),
                    expire: get(process.env, 'JWT_EXPIRE_TIME', 240)
                },
                project: {
                    url: get(process.env, 'PROJECT_ENDPOINT', ''),
                    key: get(process.env, 'PROJECT_KEY', '')
                }
            }),
            hooks: config.hooks || {}
        });
    }
}

export { Prepper };
export { Database };
export { Auth };
export { Actions };