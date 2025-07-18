import { RunService } from "@rbxts/services";

export * as Middleware from "./Middleware";
export * as RFn from "./RFunction";

export interface Service {
	OnStart: () => void;
}

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
				if (child.GetAttribute(attribute) === true) {
					continue;
				}
				const module = require(child); // eslint-disable-line
				if (
					typeIs(module, "table") &&
					"default" in module &&
					typeIs(module.default, "table") &&
					"OnStart" in module.default
				) {
					child.SetAttribute(attribute, true);
					assert(typeIs(module.default.OnStart, "function"));
					module.default.OnStart();
				}
			}
		}
	}
}
