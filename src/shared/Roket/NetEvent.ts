import { Trove } from "@rbxts/trove";
import { Middlewares, MiddlewaresOf } from "./Middleware";
import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { Middleware } from ".";
import { EmptyObject } from "./Types";

function assertRemoteEvent<TCallback extends Callback>(instance: Instance) {
	assert(instance.IsA("RemoteEvent") || instance.IsA("UnreliableRemoteEvent"));
	return instance as RemoteEvent<TCallback> & UnreliableRemoteEvent<TCallback>;
}

type Args = Record<string, unknown>;

type ListenCallback<TArgs extends Args> = (args: TArgs & { player: Player }, netEvent: NetEvent<TArgs>) => void;

type NetEventMiddlewares<TArgs extends Args> = MiddlewaresOf<NetEvent<TArgs>> & {
	ListenCallback?: Middlewares<ListenCallback<TArgs>>;
};

export default class NetEvent<
	TArgs extends Args = Record<string, never>,
	_TCallback extends Callback = (args: TArgs) => void,
> {
	private id: string;
	private remoteEvent: RemoteEvent<_TCallback> & UnreliableRemoteEvent<_TCallback>;
	private trove: Trove;
	public middlewares: NetEventMiddlewares<TArgs>;

	constructor({
		id,
		middlewares = {},
		unreliable = false,
	}: {
		id: string;
		middlewares?: NetEventMiddlewares<TArgs>;
		unreliable?: boolean;
	}) {
		this.id = id;
		this.trove = new Trove();
		this.middlewares = middlewares;

		const remoteEvents = ReplicatedStorage.WaitForChild("__Roket").WaitForChild("Events");
		if (RunService.IsServer()) {
			let instance = remoteEvents.FindFirstChild(id);
			if (!instance) {
				instance = new Instance(unreliable ? "UnreliableRemoteEvent" : "RemoteEvent");
				instance.Name = id;
				instance.Parent = remoteEvents;
			}
			this.remoteEvent = assertRemoteEvent<_TCallback>(instance);
		} else {
			const instance = remoteEvents.WaitForChild(id);
			this.remoteEvent = assertRemoteEvent<_TCallback>(instance);
		}
	}

	public Fire = Middleware.WrapKey<(args: TArgs & { target?: Player | Player[] }, netEvent: NetEvent<TArgs>) => void>(
		"Fire",
		(args, netEvent) => {
			if (RunService.IsServer()) {
				if (!args.target) {
					netEvent.remoteEvent.FireAllClients(args);
					return;
				}
				const targets: Player[] = typeIs(args.target, "Instance") ? [args.target] : args.target;
				for (const target of targets) {
					netEvent.remoteEvent.FireClient(target, args);
				}
			} else {
				netEvent.remoteEvent.FireServer(args);
			}
		},
	);

	public Listen = Middleware.WrapKey<
		(listener: ListenCallback<TArgs>, netEvent: NetEvent<TArgs>) => RBXScriptConnection
	>("Listen", (listener, netEvent) => {
		const rawListener = (player: Player, _args: unknown): void => {
			const args = _args as TArgs;
			Middleware.CallWith<typeof listener>(
				{ ...args, player },
				netEvent.middlewares.ListenCallback ?? {},
				listener,
				netEvent,
			);
		};

		if (RunService.IsServer()) {
			return netEvent.trove.add(netEvent.remoteEvent.OnServerEvent.Connect(rawListener));
		} else {
			return netEvent.trove.add(
				netEvent.remoteEvent.OnClientEvent.Connect((args) => {
					rawListener(Players.LocalPlayer, args);
				}),
			);
		}
	});

	public Disconnect = Middleware.WrapKey<(args: EmptyObject, netEvent: NetEvent<TArgs>) => void>(
		"Disconnect",
		(_args, netEvent) => {
			netEvent.trove.destroy();
		},
	);

	public Destroy = Middleware.WrapKey<(args: EmptyObject, netEvent: NetEvent<TArgs>) => void>(
		"Destroy",
		(_args, netEvent) => {
			netEvent.Disconnect({});
			if (RunService.IsServer()) {
				netEvent.remoteEvent.Destroy();
			}
		},
	);
}
