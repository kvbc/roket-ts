import NetEvent from "shared/Roket/NetEvent";

export default class NetTest {
	private static Warn = new NetEvent<{ message: string }>({
		id: "NetTestWarn",
		// #client
		middlewares: {
			ListenCallback: {
				Before: [
					(args) => {
						args.message = tostring((tonumber(args.message) ?? 0) ** 2);
					},
				],
			},
		},
		// #end
	});

	static OnStart() {
		// #server
		for (let i = 1; i <= 10; i++) {
			task.wait(2);
			NetTest.Warn.Fire({ message: tostring(i) });
		}
		// #client
		NetTest.Warn.Listen(({ message }) => {
			warn(message);
		});
		// #end
	}
}
