# inversify-config-injection
Allows the binding of configuration constants provided by the [node-config](https://github.com/lorenwest/node-config) library through the [inversify](http://inversify.io/) IoC container.

See the [node-config](https://github.com/lorenwest/node-config) documentation for how the configuration files need to be named and various other options like loading them from a `yaml` file instead of a json.

## Eager binding
For the simplest operation you can just load the container module provided by this package. This loads **all** the compatible configurations from the config file and binds them as constants. By default the keys used for the binding will be the json path to the configuration.

Assuming this is your `config/default.json`

```json
{
	"app": {
		"db": {
			"host": "localhost",
			"port": 1234,
			"seeds": ["8.8.8.8","8.8.4.4"]
		}
	},
  "other": {
    "foo":"bar"
  }
}
```

you can annotate your classes like this

```typescript
@injectable(
class DefaultDatabase implements Database{	
  public constructor(
		@inject("app.db.host") public host: string,
		@inject("app.db.port") public port: number
	){};
}
```         

When you initialise your container also import the default binder module and load it into the container:

```typescript
import {defaultEagerBinderModule} from 'inversify-config-injection';
const container = new Container();
container.load(defaultBinderModule);

container.bind<Database>("DB").to(DefaultDatabase);
const db = container.get<DefaultDatabase>("DB");

expect(db.host).to.equal("localhost");
```

Various configuration options for the binder are described below. For this you should instantiate an `EagerBinder` instead of using `defaultEagerBinderModule`

```typescript
import {EagerBinder} from 'inversify-config-injection';
const container = new Container();
const configBinder = new EagerBinder({
  log: true,
  root: 'app',
  prefix: 'cfg',
  objects: true,
  typeHints: {
    'app.db.seeds': TypeHint.String
  }
});
container.load(configBinder.module());
```

### Binding only part of the configuration file

Use the `root` configuration parameter of the eager binder. This will only load children of this particular path. For our above example:

```typescript
new EagerBinder({
  root: 'app'
});
``` 
only loads the `app` breanch of the configuration. The keys necessary for injecting are also shortened.

```typescript
@injectable(
class DefaultDatabase implements Database{	
  public constructor(
		@inject("db.host") public host: string,
		@inject("db.port") public port: number
	){};
}
```

### Adding a prefix to the binding key

In order to avoid collisions you can add a prefix to the binding keys. For our above example:
```typescript
new EagerBinder({
  root: 'app',
  prefix: 'cfg'
});
``` 

This makes correct biding:

```typescript
@injectable(
class DefaultDatabase implements Database{	
  public constructor(
		@inject("cfg.db.host") public host: string,
		@inject("cfgdb.port") public port: number
	){};
}
```

Note that there is no `cfg` key in the configuration json.

### Binding entire objects

In addition to binding every leaf entry of the configuration, you can also bind the intermediary object by turning on `objects` in the EagerBinder settings.

```typescript
new EagerBinder({
  root: 'app',
  objects: true
});
``` 

This will bind to constants `db.host`, `db.port`, `db.seeds` but also `db` as the constant object
```js
{
  host: "localhost",
	port: 1234,
	seeds: ["8.8.8.8","8.8.4.4"]
}
```

### Binding logs

For debugging purposes, you can turn on binding logs
```typescript
new EagerBinder({
  log: true
});
``` 

This allows you to get an array of logs with `binder.getBindingLog()`

```typescript
console.log( binder.getBindingLog().join("\n") );
```

```
Binding 'cfg.db.host' to string 'localhost'
Binding 'cfg.db.port' to number '1234'
Binding 'cfg.db.seeds' to string[] '8.8.8.8,8.8.4.4'
```
