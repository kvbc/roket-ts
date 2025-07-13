import { Middleware } from "shared/Roket";
import { EmptyObject } from "shared/Roket/Types";

interface ICar {
	Drive: (car: Car, args: { distance: number }) => void;
}

export default class Car implements ICar {
	private brand: string;
	private color: string;
	private mileage: number;
	public middlewares: Middleware.Middlewares<ICar>;

	constructor(brand: string, color: string, mileage: number) {
		this.brand = brand;
		this.color = color;
		this.mileage = mileage;
		this.middlewares = {
			Drive: {
				before: [
					(args) => {
						print(args);
					},
				],
			},
		};
	}

	public Drive = Middleware.WrapKey<Car, { distance: number }>("Drive", (args, car) => {
		car.mileage += args.distance;
		return {};
	});
}
