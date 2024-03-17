import get from 'lodash/get';
import set from 'lodash/set';
import has from 'lodash/has';
import { PrepScope } from '@formio/appserver-types';
export default async (scope: PrepScope) => {
    // Check if they do not provide a password in the save, but one exists in the current record.
    // Do not allow them to wipe out their password by saving data that does not include one.
    const { type, component, row, current, path, data } = scope;
    if (component.type === 'password' && type === 'save') {
        const currentPass = get(current, `data.${path}`);
        if (!get(row, component.key) && currentPass) {
            set(data, path, currentPass);
        }
    }
};