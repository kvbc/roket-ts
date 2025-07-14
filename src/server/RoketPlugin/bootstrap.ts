import { ReplicatedStorage, ServerScriptService, ServerStorage, StarterPlayer } from "@rbxts/services";

type Scope = "client" | "server" | "shared";
type Sources = {
	client: string;
	server: string;
};

function ensureEmptyFolder(parent: Instance, name: string): Folder {
	const folder = parent.FindFirstChild(name);
	if (folder) {
		assert(folder.IsA("Folder"));
		folder.ClearAllChildren();
		return folder;
	} else {
		const newFolder = new Instance("Folder");
		newFolder.Name = name;
		newFolder.Parent = parent;
		return newFolder;
	}
}

function insertModuleScript(parent: Instance, name: string, source: string) {
	if (source.size() === 0) {
		return;
	}
	assert(!parent.FindFirstChild(name));
	const newScript = new Instance("ModuleScript");
	newScript.Name = name;
	newScript.Parent = parent;
	newScript.Source = source;
}

function getSourceLineScope(line: string): Scope | undefined {
	const matches = (directive: string): boolean => {
		return line.match("^%s*--%s*#" + directive)[0] !== undefined;
	};
	if (matches("server")) return "server";
	if (matches("client")) return "client";
	if (matches("end")) return "shared";
	return undefined;
}

function splitSource(source: string): Sources {
	const sources: Sources = {
		client: "",
		server: "",
	};
	let scope: Scope = "shared";
	for (let line of source.split("\n")) {
		const newScope = getSourceLineScope(line);
		if (newScope) {
			scope = newScope;
		} else {
			// e.g. local Car = TS.import(script, game:GetService("ServerStorage"), "TS", "RoketScripts", "Car").default
			// into local Car = require(script.Parent, "Car").default
			line = line.gsub(
				'TS.import%(script, game:GetService%("ServerStorage"%), "TS", "RoketScripts"',
				"require(script.Parent",
			)[0];

			// e.g. local Car = require(script.Parent, "Car").default
			// into local Car = require(script.Parent.Car).default
			if (line.find("require%(script.Parent")[0] !== undefined) {
				line = line.gsub(', "([^"]+)"', ".%1")[0];
			}

			if (scope === "shared") {
				sources.client += line + "\n";
				sources.server += line + "\n";
			} else {
				sources[scope] += line + "\n";
			}
		}
	}
	return sources;
}

export function bootstrap() {
	const serverFolder = ensureEmptyFolder(ServerScriptService, "__Roket");
	const serverScriptsFolder = ensureEmptyFolder(serverFolder, "Scripts");
	{
		const serverRuntime = script.Parent!.WaitForChild("serverRuntime").Clone() as LocalScript;
		serverRuntime.Parent = serverFolder;
		serverRuntime.Enabled = true;
	}

	const clientFolder = ensureEmptyFolder(ReplicatedStorage, "__Roket");
	const clientScriptsFolder = ensureEmptyFolder(clientFolder, "Scripts");
	{
		const clientRuntime = script.Parent!.WaitForChild("clientRuntime").Clone() as LocalScript;
		clientRuntime.Parent = ensureEmptyFolder(StarterPlayer.WaitForChild("StarterPlayerScripts"), "__Roket");
		clientRuntime.Enabled = true;
	}

	const scripts = ServerStorage.WaitForChild("TS").WaitForChild("RoketScripts").GetChildren();
	for (const child of scripts) {
		if (child.IsA("ModuleScript")) {
			if (child.Source.match("^--#ignore")[0] !== undefined) {
				continue;
			}
			const sources = splitSource(child.Source);
			insertModuleScript(serverScriptsFolder, child.Name, sources.server);
			insertModuleScript(clientScriptsFolder, child.Name, sources.client);
		}
	}
}
