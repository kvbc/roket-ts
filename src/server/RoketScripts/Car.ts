import { Middleware } from "shared/Roket";

export default class Car {
	private brand: string;
	private color: string;
	private mileage: number;
	public middlewares: Middleware.MiddlewaresOf<Car>;

	constructor(brand: string, color: string, mileage: number) {
		this.brand = brand;
		this.color = color;
		this.mileage = mileage;
		this.middlewares = {
			Drive: {
				Before: [
					(args, car) => {
						print(args);
					},
				],
			},
		};
	}

	public Drive = Middleware.WrapKey<(args: { distance: number }, car: Car) => void>("Drive", (args, car) => {
		car.mileage += args.distance;
		return {};
	});
}
