import { Middleware } from "shared/Roket";

type Args = {
	message: string;
	color?: string;
};

const mentionColorMiddleware: Middleware.Fn<Args> = (args) => {
	args.message += ` (i like ${args.color})`;
};

function myPrint(args: Args) {
	print(`Hello! ${args.message}`);
}

export default class Test {
	static RoketStart() {
		print("test service started");
		//#server
		print("server");
		myPrint({ message: "whats up?" });
		//#client
		print("client");
		Middleware.Call<Args>({ message: "this is not a joke", color: "red" }, mentionColorMiddleware, myPrint);
		//#end
	}
}
