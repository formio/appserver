import { PrepScope, Prepper as PrepperType } from '@formio/appserver-types';
export declare const Preppers: {
    bcrypt: (scope: PrepScope) => Promise<void>;
    access: (scope: PrepScope) => Promise<void>;
    persist: (scope: PrepScope) => Promise<void>;
    protect: (scope: PrepScope) => Promise<void>;
    password: (scope: PrepScope) => Promise<void>;
    referenceLoad: (scope: PrepScope) => Promise<void>;
    referenceSave: (scope: PrepScope) => Promise<void>;
};
export declare const Prepper: PrepperType;
