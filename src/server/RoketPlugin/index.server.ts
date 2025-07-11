/// <reference types="@rbxts/types/plugin" />

import { RunService } from "@rbxts/services";
import { bootstrap } from "./bootstrap";

const toolbar = plugin.CreateToolbar("Roket");
const button = toolbar.CreateButton("Roket", "Bootstrap Roket", "rbxassetid://2747029325");

button.Click.Connect(() => {
	bootstrap();
});

task.spawn(() => {
	while (true) {
		task.wait(5);
		if (RunService.IsStudio() && RunService.IsEdit()) {
			bootstrap();
		}
	}
});
