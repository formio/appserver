import get from 'lodash/get';
import bcrypt from './bcrypt';
import access from './access';
import persist from './persist';
import protect from './protect';
import password from './password';
import { referenceLoad, referenceSave } from './reference';
import { PrepScope, Prepper as PrepperType } from '@formio/appserver-types';
import { Utils } from '@formio/core';
export const Preppers = {
    bcrypt,
    access,
    persist,
    protect,
    password,
    referenceLoad,
    referenceSave
};

const debug = require('debug')('formio:prepare');
const error = require('debug')('formio:error');
export const Prepper: PrepperType = {
    preppers: {
        save: [Preppers.persist, Preppers.access, Preppers.password, Preppers.bcrypt, Preppers.referenceSave],
        read: [Preppers.protect, Preppers.referenceLoad]
    },
    async prepare(scope: PrepScope) {
        let data = {};
        const { type, form, submission } = scope;
        try {
            debug(`Preparing data for ${form.name}...`);
            await scope.utils.eachComponentData(form.components, submission.data, async (component: any, compData: any, compRow: any, compPath: string) => {
                if (Prepper.preppers.hasOwnProperty(type)) {
                    for (let i = 0; i < (Prepper.preppers as any)[type].length; i++) {
                        await (Prepper.preppers as any)[type][i]({
                            ...scope,
                            component,
                            row: compRow,
                            data,
                            value: get(compData, compPath),
                            path: Utils.getComponentAbsolutePath(component)
                        });
                    }
                }
            });
        }
        catch (err) {
            error(err);
            data = {};
        }
        return data;
    }
};
