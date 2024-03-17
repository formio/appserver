import { FormScope } from "./form";
import { PrepScope } from "./submission";
import { OfflineLicenseStruct } from '@formio/license';
import { ValidationContext, ProcessTarget } from "@formio/core/types";
export interface ProjectConfig {
    url: string;
    key: string;
}
export interface User {
    _id: string;
    data: any;
    roles: string[];
    form: string;
    project: string;
    metadata: any;
}
export interface AuthToken {
    iat?: number;
    exp?: number;
    user: User;
    form: {
        _id: string;
    };
    project: {
        _id: string;
    };
}
export interface AuthConfig {
    portal: string;
    secret: string;
    expire: number;
}
export interface ServerConfig {
    project: ProjectConfig;
    auth: AuthConfig;
    license: string;
    status: any;
    cache: boolean;
}
export interface DBConfig {
    url: string;
    ttl?: number;
    dropOnConnect?: boolean;
    config: any;
}
export interface ServerDB {
    config: DBConfig;
    connect: (prefix?: string) => Promise<void>;
    saveOne: (collection: string, doc: any) => Promise<any>;
    save: (collection: string, doc: any) => Promise<any>;
    load: (collection: string, query?: any) => Promise<any>;
    remove: (collection: string, query?: any) => Promise<any>;
    index: (scope: FormScope, query: any) => Promise<any>;
    create: (scope: FormScope, doc: any, allowFields?: string[]) => Promise<any>;
    read: (scope: FormScope, id: string) => Promise<any>;
    update: (scope: FormScope, id: string, doc: any, allowFields?: string[]) => Promise<any>;
    delete: (scope: FormScope, id: string) => Promise<any>;
    find: (scope: FormScope, query: any) => Promise<any>;
    findOne: (scope: FormScope, query: any) => Promise<any>;
    formCollection: (scope: FormScope) => Promise<any>;
    addIndexes: (scope: FormScope, indexes: string[]) => Promise<any>;
    removeIndexes: (scope: FormScope, indexes: string[]) => Promise<any>;
    isUnique: (scope: FormScope, context: ValidationContext, value: any) => Promise<boolean | string>;
}
export interface AuthModule {
    token: (user: AuthToken, secret: string, expire: number) => Promise<string>;
    user: (token: string, secret: string) => Promise<AuthToken | null>;
}
export interface Preppers {
    save: Array<(scope: PrepScope) => Promise<any>>;
    read: Array<(scope: PrepScope) => Promise<any>>;
}
export interface Prepper {
    preppers: Preppers;
    prepare: (scope: PrepScope) => Promise<any>;
}
export interface ServerScope {
    config: ServerConfig;
    db: ServerDB;
    auth: AuthModule;
    actions: any;
    processors: ProcessTarget;
    prepper: Prepper;
    access?: any;
    hooks?: any;
    template?: any;
    utils?: any;
    util?: any;
    server?: any;
    hook?: (name: string, ...args: any[]) => void;
    licenseKey?: OfflineLicenseStruct;
}
export interface AppServerScope {
    config?: ServerConfig;
    db?: ServerDB;
    auth?: AuthModule;
    processors?: ProcessTarget;
    preppers?: Preppers;
    actions?: any;
    hooks?: any;
}
