import { Middleware } from "shared/Roket";
import Car from "./Car";

function myPrint(args: { message: string; color?: string }) {
	print(`Hello! ${args.message}`);
}

const mentionColorMiddleware: Middleware.Fn<typeof myPrint> = (args) => {
	args.message += ` (i like ${args.color})`;
};

const specialPrint = Middleware.Wrap(
	{
		before: [mentionColorMiddleware],
	},
	myPrint,
);

export default class Test {
	static RoketStart() {
		print("test service started");

		//#server
		print("server");
		myPrint({ message: "whats up?" });
		//#client
		print("client");
		specialPrint({ message: "aight thats my special print because", color: "pink" });
		// Middleware.Call(myPrint, mentionColorMiddleware, { message: "this is not a joke", color: "red" });
		//#end

		const car = new Car("toyota", "blue", 600);
		car.Drive({ distance: 100 });
	}
}
