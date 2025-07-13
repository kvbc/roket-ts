import { RunService } from "@rbxts/services";

export * as Middleware from "./Middleware";
export * as RFn from "./RFunction";
export * as Types from "./Types";

export default class Roket {
	public static IsServer() {
		return RunService.IsServer();
	}

	public static IsClient() {
		return RunService.IsClient();
	}

	public static Start(moduleScriptsParent: Instance) {
		for (const child of moduleScriptsParent.GetChildren()) {
			if (child.IsA("ModuleScript")) {
				const attribute = "__RoketStarted";
				print(">1", child, child.GetAttribute(attribute));
				if (child.GetAttribute(attribute) === true) {
					continue;
				}
				print(">2", child);
				const module = require(child);
				print(">3", child, attribute, module, typeOf(module));
				if (
					typeIs(module, "table") &&
					"default" in module &&
					typeIs(module.default, "table") &&
					"RoketStart" in module.default
				) {
					child.SetAttribute(attribute, true);
					assert(typeIs(module.default.RoketStart, "function"));
					module.default.RoketStart();
				}
			}
		}
	}
}
