import {ContainerModule, interfaces} from 'inversify';
import * as config from 'config';

export enum TypeHint {
  String, Number
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

export class EagerBinder {

  private all: object;
  private logs: string[];

  constructor(private settings: EagerBinderSettings) {
    if (!this.settings) this.settings = {};
    if (!this.settings.root) this.settings.root = "";
    if (!this.settings.prefix) this.settings.prefix = "";
    if (!this.settings.typeHints) this.settings.typeHints = {};
    if (!this.settings.log) this.settings.log = false;
    if (!this.settings.objects) this.settings.objects = false;

    if (this.settings.root === "") {
      this.all = config;
    } else if (config.has(this.settings.root)) {
      this.all = config.get<object>(this.settings.root);
    } else {
      throw new Error(`Could not find configuration root '${this.settings.root}'!`);
    }

    this.logs = [];
  }

  private bindString(bind: interfaces.Bind, val: string, path: string) {
    if (this.settings.log) this.logs.push(`Binding '${path}' to string '${val}'`);
    bind<string>(path).toConstantValue(val);
  }

  private bindNumber(bind: interfaces.Bind, val: number, path: string) {
    if (this.settings.log) this.logs.push(`Binding '${path}' to number '${val}'`);
    bind<number>(path).toConstantValue(val);
  }

  private bindBoolean(bind: interfaces.Bind, val: boolean, path: string) {
    if (this.settings.log) this.logs.push(`Binding '${path}' to boolean '${val}'`);
    bind<boolean>(path).toConstantValue(val);
  }

  private bindArray(bind: interfaces.Bind, val: any[], path: string) {
    if (this.settings.typeHints[path] === TypeHint.String) {
      if (this.settings.log) this.logs.push(`Binding '${path}' to string[] '${val}'`);
      bind<string[]>(path).toConstantValue(val as string[]);
    } else if (this.settings.typeHints[path] === TypeHint.Number) {
      if (this.settings.log) this.logs.push(`Binding '${path}' to number[] '${val}'`);
      bind<number[]>(path).toConstantValue(val as number[]);
    } else {
      if (this.settings.log) this.logs.push(`Binding '${path}' to any[] '${val}'`);
      bind<any[]>(path).toConstantValue(val);
    }
  }

  private bindUnknown(bind: interfaces.Bind, val: any, path: string) {
    if (typeof val === 'string') {
      this.bindString(bind, val as string, path);
    } else if (typeof val === 'number') {
      this.bindNumber(bind, val as number, path);
    } else if (typeof val === 'boolean') {
      this.bindBoolean(bind, val as boolean, path);
    } else if (val instanceof Array) {
      this.bindArray(bind, val as any[], path);
    } else if (typeof val === 'object') {
      this.bindAllInObject(bind, val, path);
    }
  }

  private bindAllInObject(bind: interfaces.Bind, obj: object, path: string) {
    if (this.settings.objects) {
      if (this.settings.log) {
        this.logs.push(`Binding '${path}' to Object '${obj}'`);
      }
      bind<object>(path).toConstantValue(obj);
    }

    if (path && path.length > 0) {
      path = path + ".";
    }

    for (const k in obj) {
      if (obj.hasOwnProperty(k)) {
        this.bindUnknown(bind, (obj as any)[k], path + k);
      }
    }
  }

  public getModuleFunction() {
    return (bind: interfaces.Bind, unbind: interfaces.Unbind) => {
      this.bindAllInObject(bind, this.all, this.settings.prefix);
    };
  }

  public getModule() {
    return new ContainerModule(this.getModuleFunction());
  }

  public getBindingLog() {
    return this.logs;
  }
}

export const defaultEagerBinderModule = new EagerBinder({}).getModule();
export default defaultEagerBinderModule;
