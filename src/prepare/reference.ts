import { set, get } from 'lodash';
import { PrepScope } from '@formio/appserver-types';
import protect from './protect';

const getResource = (scope: PrepScope) => {
    const { component } = scope;
    const resourceId = component.data?.resource;
    let resource = scope.server?.project.forms[resourceId];
    if (!resource) {
        for (let name in scope.server?.project.forms) {
            const form = scope.server?.project.forms[name].clientForm;
            if (form._id.toString() === resourceId) {
                resource = scope.server?.project.forms[name];
                break;
            }
        }
    }
    return resource;
};

export const referenceLoad = async (scope: PrepScope) => {
    const { component, data, value, path } = scope;
    if (!value) {
        return;
    }
    if (component.reference) {
        const resource = getResource(scope);
        if (resource) {
            const submission = await resource.loadSubmission(value._id);
            if (submission) {
                // Make sure to protect this submission like any other submission output.
                const context = {
                    ...scope,
                    data: {}
                };
                await scope.utils.eachComponentDataAsync(
                    resource.clientForm.components, 
                    submission.data, 
                    async (comp: any, compData: any, compRow: any, compPath: string) => {
                        await protect({
                            ...context,
                            component: comp,
                            row: compRow,
                            data: compData,
                            value: get(compRow, comp.key),
                            path: compPath
                        });
                });
                submission.data = context.data;
                set(data, path, submission);
            }
        }
        
    }
};

export const referenceSave = async (scope: PrepScope) => {
    const { component, data, value, path } = scope;
    if (!value || !value._id) {
        return;
    }
    if (component.reference && value._id) {
        const resource = getResource(scope);
        if (resource) {
            set(data, path, {
                _id: value._id,
                form: resource.clientForm._id
            });
        }
    }
};