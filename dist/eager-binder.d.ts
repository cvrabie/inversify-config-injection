import { ContainerModule, interfaces } from 'inversify';
export declare enum TypeHint {
    String = 0,
    Number = 1,
}
export interface TypeHints {
    [key: string]: TypeHint;
}
export interface EagerBinderSettings {
    root?: string;
    prefix?: string;
    log?: boolean;
    typeHints?: TypeHints;
    objects?: boolean;
}
export declare class EagerBinder {
    private settings;
    private all;
    private logs;
    constructor(settings: EagerBinderSettings);
    private bindString(bind, val, path);
    private bindNumber(bind, val, path);
    private bindBoolean(bind, val, path);
    private bindArray(bind, val, path);
    private bindUnknown(bind, val, path);
    private bindAllInObject(bind, obj, path);
    getModuleFunction(): (bind: interfaces.Bind, unbind: interfaces.Unbind) => void;
    getModule(): ContainerModule;
    getBindingLog(): string[];
}
export declare const defaultEagerBinderModule: ContainerModule;
export default defaultEagerBinderModule;
