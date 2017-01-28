import { EagerBinder, EagerBinderSettings, TypeHint } from "../src/eager-binder";
import defaultBinderModule from "../src/eager-binder";
import * as chai from "chai";
import { injectable, inject } from "inversify";
import { Container } from "inversify";
import "reflect-metadata";

const expect = chai.expect;

interface Database {
    getConnection(): string;
}

@injectable()
class DefaultDatabase implements Database{
	public constructor(
		@inject("app.db.host") public host: string,
		@inject("app.db.port") public port: number
	){};
	public getConnection(){
		return this.host+":"+this.port;
	}
}

@injectable()
class DifferentRootDatabase implements Database{
	public constructor(
		@inject("db.host") public host: string,
		@inject("db.port") public port: number
	){};
	public getConnection(){
		return this.host+":"+this.port;
	}
}

@injectable()
class PrefixedDatabase implements Database{
	public constructor(
		@inject("cfg.db.host") public host: string,
		@inject("cfg.db.port") public port: number
	){};
	public getConnection(){
		return this.host+":"+this.port;
	}
}

@injectable()
class ArrayTestDatabase implements Database{
	public constructor(
		@inject("cfg.db.seeds") public seeds: string[],
		@inject("cfg.db.port") public port: number
	){};
	public getConnection(){
		return this.seeds.map(s=>s+':'+this.port).join(',');
	}
}

@injectable()
class ObjectTestDatabase implements Database{
	public constructor(
		@inject("app.db") public cfg: any
	){};
	public getConnection(){
		return this.cfg.host+":"+this.cfg.port;
	}
}


describe("EagerBinder", () => {
  
  it("should load properties with default settings", () => {
	const container = new Container();
	container.bind<Database>("DB").to(DefaultDatabase);
	container.load(defaultBinderModule);

  	const db = container.get<DefaultDatabase>("DB");
    expect(db.getConnection()).to.equal("localhost:1234");
  });
  
  it("should load properties with a different root", () => {
	const container = new Container();
	container.bind<Database>("DB").to(DifferentRootDatabase);
	container.load(new EagerBinder({
		root: 'app'
	}).getModule());

  	const db = container.get<Database>("DB");
    expect(db.getConnection()).to.equal("localhost:1234");
  });
  
  it("should load properties with a custom prefix binding", () => {
	const container = new Container();
	container.bind<Database>("DB").to(PrefixedDatabase);
	const binder = new EagerBinder({
		root: 'app',
		log: true,
		prefix: 'cfg'
	});
	container.load(binder.getModule());

    console.log(binder.getBindingLog().join("\n"));
  	const db = container.get<Database>("DB");
    expect(db.getConnection()).to.equal("localhost:1234");
  });
  
  it("should load arrays", () => {
	const container = new Container();
	container.bind<Database>("DB").to(ArrayTestDatabase);
	const binder = new EagerBinder({
		root: 'app',
		log: true,
		prefix: 'cfg',
		typeHints: {
			'cfg.db.seeds': TypeHint.String
		}
	});
	container.load(binder.getModule());

    console.log(binder.getBindingLog().join("\n"));
  	const db = container.get<Database>("DB");
    expect(db.getConnection()).to.equal("8.8.8.8:1234,8.8.4.4:1234");
  });
  
  it("should load entire objects", () => {
	const container = new Container();
	container.bind<Database>("DB").to(ObjectTestDatabase);
	const binder = new EagerBinder({
		log: true,
		objects: true
	});
	container.load(binder.getModule());

    console.log(binder.getBindingLog().join("\n"));
  	const db = container.get<Database>("DB");
    expect(db.getConnection()).to.equal('localhost:1234');
  });

});
