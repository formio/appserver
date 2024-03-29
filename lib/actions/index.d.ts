declare const _default: {
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
        mappingComponents(scope: import("../types/lib").ActionScope): Promise<any>;
        settingsForm(scope: import("../types/lib").ActionScope): Promise<any>;
        saveToForm(scope: import("../types/lib").ActionScope, resource: string): undefined;
        childSubmission(scope: import("../types/lib").ActionScope, req: import("../types/lib").SubmissionRequest, res: import("../types/lib").SubmissionResponse, submission: any): any;
        childResponse(scope: import("../types/lib").ActionScope, req: import("../types/lib").SubmissionRequest, res: import("../types/lib").SubmissionResponse): void;
        executor(scope: import("../types/lib").ActionScope): Promise<(req: import("../types/lib").SubmissionRequest, res: import("../types/lib").SubmissionResponse, next: import("express").NextFunction) => Promise<void>>;
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
        settingsForm(scope: import("../types/lib").ActionScope): Promise<({
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
        checkAttempts(scope: import("../types/lib").ActionScope, error: any, user: import("../types/lib").User): Promise<any>;
        executor(scope: import("../types/lib").ActionScope): Promise<(req: import("../types/lib").SubmissionRequest, res: import("../types/lib").SubmissionResponse, next: import("express").NextFunction) => Promise<void>>;
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
        settingsForm(scope: import("../types/lib").ActionScope): Promise<({
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
        executor(scope: import("../types/lib").ActionScope): Promise<(req: import("../types/lib").SubmissionRequest, res: import("../types/lib").SubmissionResponse, next: import("express").NextFunction) => Promise<void | import("../types/lib").SubmissionResponse>>;
    };
};
export default _default;
