/// <reference types="express" />
import { Server as CoreServer } from '@formio/appserver-core';
import { Database, Auth } from "./modules";
import Actions from "./actions";
import { Prepper } from './prepare';
import { AppServerScope } from '@formio/appserver-types';
export declare const Modules: {
    db: typeof Database;
    auth: typeof Auth;
    processors: ProcessTarget;
    prepper: import("@formio/appserver-types").Prepper;
    actions: {
        save: {
            readonly info: {
                name: string;
                title: string;
                description: string;
                priority: number;
                defaults: {
                    handler: string[];
                    method: string[];
                };
                access: {
                    handler: boolean;
                    method: boolean;
                };
            };
            mappingComponents(scope: import("@formio/appserver-types").ActionScope): Promise<any>;
            settingsForm(scope: import("@formio/appserver-types").ActionScope): Promise<any>;
            saveToForm(scope: import("@formio/appserver-types").ActionScope, resource: string): undefined;
            childSubmission(scope: import("@formio/appserver-types").ActionScope, req: import("@formio/appserver-types").SubmissionRequest, res: import("@formio/appserver-types").SubmissionResponse, submission: any): any;
            childResponse(scope: import("@formio/appserver-types").ActionScope, req: import("@formio/appserver-types").SubmissionRequest, res: import("@formio/appserver-types").SubmissionResponse): void;
            executor(scope: import("@formio/appserver-types").ActionScope): Promise<(req: import("@formio/appserver-types").SubmissionRequest, res: import("@formio/appserver-types").SubmissionResponse, next: import("express").NextFunction) => Promise<void>>;
        };
        login: {
            readonly info: {
                name: string;
                title: string;
                description: string;
                priority: number;
                defaults: {
                    handler: string[];
                    method: string[];
                };
                access: {
                    handler: boolean;
                    method: boolean;
                };
            };
            settingsForm(scope: import("@formio/appserver-types").ActionScope): Promise<({
                type: string;
                label: string;
                key: string;
                placeholder: string;
                dataSrc: string;
                valueProperty: string;
                data: {
                    json: any;
                };
                multiple: boolean;
                validate: {
                    required: boolean;
                };
                input?: undefined;
                description?: undefined;
                defaultValue?: undefined;
                suffix?: undefined;
            } | {
                type: string;
                input: boolean;
                label: string;
                key: string;
                placeholder: string;
                dataSrc: string;
                valueProperty: string;
                data: {
                    json: any;
                };
                multiple: boolean;
                validate: {
                    required: boolean;
                };
                description?: undefined;
                defaultValue?: undefined;
                suffix?: undefined;
            } | {
                type: string;
                key: string;
                input: boolean;
                label: string;
                description: string;
                defaultValue: string;
                placeholder?: undefined;
                dataSrc?: undefined;
                valueProperty?: undefined;
                data?: undefined;
                multiple?: undefined;
                validate?: undefined;
                suffix?: undefined;
            } | {
                type: string;
                key: string;
                input: boolean;
                label: string;
                description: string;
                defaultValue: string;
                suffix: string;
                placeholder?: undefined;
                dataSrc?: undefined;
                valueProperty?: undefined;
                data?: undefined;
                multiple?: undefined;
                validate?: undefined;
            })[]>;
            waitText(time: number): string;
            checkAttempts(scope: import("@formio/appserver-types").ActionScope, error: any, user: import("@formio/appserver-types").User): Promise<any>;
            executor(scope: import("@formio/appserver-types").ActionScope): Promise<(req: import("@formio/appserver-types").SubmissionRequest, res: import("@formio/appserver-types").SubmissionResponse, next: import("express").NextFunction) => Promise<void>>;
        };
        role: {
            readonly info: {
                name: string;
                title: string;
                description: string;
                priority: number;
                defaults: {
                    handler: string[];
                    method: string[];
                };
                access: {
                    handler: boolean;
                    method: boolean;
                };
            };
            settingsForm(scope: import("@formio/appserver-types").ActionScope): Promise<({
                type: string;
                input: boolean;
                label: string;
                key: string;
                placeholder: string;
                template: string;
                dataSrc: string;
                data: {
                    json: string;
                };
                valueProperty: string;
                multiple: boolean;
                validate: {
                    required: boolean;
                };
            } | {
                type: string;
                input: boolean;
                label: string;
                key: string;
                placeholder: string;
                template: string;
                dataSrc: string;
                data: {
                    json: unknown[];
                };
                valueProperty: string;
                multiple: boolean;
                validate: {
                    required: boolean;
                };
            })[]>;
            executor(scope: import("@formio/appserver-types").ActionScope): Promise<(req: import("@formio/appserver-types").SubmissionRequest, res: import("@formio/appserver-types").SubmissionResponse, next: import("express").NextFunction) => Promise<void | import("@formio/appserver-types").SubmissionResponse>>;
        };
    };
};
export declare class Server extends CoreServer {
    constructor(config?: AppServerScope);
}
export { Prepper };
export { Database };
export { Auth };
export { Actions };
