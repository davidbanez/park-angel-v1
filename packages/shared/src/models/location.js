import { UserId, Coordinates, Address } from './value-objects';
// Vehicle type enum for runtime comparisons
export var VehicleTypeEnum;
(function (VehicleTypeEnum) {
    VehicleTypeEnum["CAR"] = "car";
    VehicleTypeEnum["MOTORCYCLE"] = "motorcycle";
    VehicleTypeEnum["TRUCK"] = "truck";
    VehicleTypeEnum["VAN"] = "van";
    VehicleTypeEnum["SUV"] = "suv";
})(VehicleTypeEnum || (VehicleTypeEnum = {}));
export class Location {
    constructor(id, name, type, operatorId, address, coordinates, sections, pricing, settings, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "operatorId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: operatorId
        });
        Object.defineProperty(this, "address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: address
        });
        Object.defineProperty(this, "coordinates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: coordinates
        });
        Object.defineProperty(this, "sections", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: sections
        });
        Object.defineProperty(this, "pricing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: pricing
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: settings
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new Location(UserId.generate().value, data.name, data.type, data.operatorId, new Address(data.address), new Coordinates(data.coordinates.latitude, data.coordinates.longitude), [], data.pricing, LocationSettings.create(data.settings), new Date(), new Date());
    }
    addSection(sectionData) {
        const section = Section.create({
            ...sectionData,
            locationId: this.id,
        });
        this.sections.push(section);
        this.updatedAt = new Date();
        return section;
    }
    removeSection(sectionId) {
        this.sections = this.sections.filter(s => s.id !== sectionId);
        this.updatedAt = new Date();
    }
    getSection(sectionId) {
        return this.sections.find(s => s.id === sectionId);
    }
    getAllSpots() {
        return this.sections.flatMap(section => section.getAllSpots());
    }
    getAvailableSpots() {
        return this.getAllSpots().filter(spot => spot.isAvailable());
    }
    getOccupiedSpots() {
        return this.getAllSpots().filter(spot => spot.isOccupied());
    }
    getTotalCapacity() {
        return this.getAllSpots().length;
    }
    getOccupancyRate() {
        const totalSpots = this.getTotalCapacity();
        if (totalSpots === 0)
            return 0;
        const occupiedSpots = this.getOccupiedSpots().length;
        return (occupiedSpots / totalSpots) * 100;
    }
    updatePricing(pricing) {
        this.pricing = pricing;
        this.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.settings = this.settings.update(settings);
        this.updatedAt = new Date();
    }
    isOperational() {
        return this.settings.isCurrentlyOpen();
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            operatorId: this.operatorId.value,
            address: this.address.toJSON(),
            coordinates: this.coordinates.toJSON(),
            sections: this.sections.map(s => s.toJSON()),
            pricing: this.pricing.toJSON(),
            settings: this.settings.toJSON(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
export class Section {
    constructor(id, locationId, name, zones, pricing, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "locationId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: locationId
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "zones", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: zones
        });
        Object.defineProperty(this, "pricing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: pricing
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new Section(UserId.generate().value, data.locationId, data.name, [], data.pricing, new Date(), new Date());
    }
    addZone(zoneData) {
        const zone = Zone.create({
            ...zoneData,
            sectionId: this.id,
        });
        this.zones.push(zone);
        this.updatedAt = new Date();
        return zone;
    }
    removeZone(zoneId) {
        this.zones = this.zones.filter(z => z.id !== zoneId);
        this.updatedAt = new Date();
    }
    getZone(zoneId) {
        return this.zones.find(z => z.id === zoneId);
    }
    getAllSpots() {
        return this.zones.flatMap(zone => zone.spots);
    }
    getAvailableSpots() {
        return this.getAllSpots().filter(spot => spot.isAvailable());
    }
    getTotalCapacity() {
        return this.getAllSpots().length;
    }
    getOccupancyRate() {
        const totalSpots = this.getTotalCapacity();
        if (totalSpots === 0)
            return 0;
        const occupiedSpots = this.getAllSpots().filter(spot => spot.isOccupied()).length;
        return (occupiedSpots / totalSpots) * 100;
    }
    updatePricing(pricing) {
        this.pricing = pricing;
        this.updatedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            locationId: this.locationId,
            name: this.name,
            zones: this.zones.map(z => z.toJSON()),
            pricing: this.pricing?.toJSON(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
export class Zone {
    constructor(id, sectionId, name, spots, pricing, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "sectionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: sectionId
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "spots", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: spots
        });
        Object.defineProperty(this, "pricing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: pricing
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new Zone(UserId.generate().value, data.sectionId, data.name, [], data.pricing, new Date(), new Date());
    }
    addSpot(spotData) {
        const spot = ParkingSpot.create({
            ...spotData,
            zoneId: this.id,
        });
        this.spots.push(spot);
        this.updatedAt = new Date();
        return spot;
    }
    removeSpot(spotId) {
        this.spots = this.spots.filter(s => s.id !== spotId);
        this.updatedAt = new Date();
    }
    getSpot(spotId) {
        return this.spots.find(s => s.id === spotId);
    }
    getAvailableSpots() {
        return this.spots.filter(spot => spot.isAvailable());
    }
    getOccupiedSpots() {
        return this.spots.filter(spot => spot.isOccupied());
    }
    getTotalCapacity() {
        return this.spots.length;
    }
    getOccupancyRate() {
        const totalSpots = this.getTotalCapacity();
        if (totalSpots === 0)
            return 0;
        const occupiedSpots = this.getOccupiedSpots().length;
        return (occupiedSpots / totalSpots) * 100;
    }
    updatePricing(pricing) {
        this.pricing = pricing;
        this.updatedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            sectionId: this.sectionId,
            name: this.name,
            spots: this.spots.map(s => s.toJSON()),
            pricing: this.pricing?.toJSON(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
export class ParkingSpot {
    constructor(id, zoneId, number, type, status, coordinates, amenities, pricing, createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "zoneId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: zoneId
        });
        Object.defineProperty(this, "number", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: number
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "coordinates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: coordinates
        });
        Object.defineProperty(this, "amenities", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: amenities
        });
        Object.defineProperty(this, "pricing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: pricing
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new ParkingSpot(UserId.generate().value, data.zoneId, data.number, data.type, SpotStatus.AVAILABLE, new Coordinates(data.coordinates.latitude, data.coordinates.longitude), data.amenities || [], data.pricing, new Date(), new Date());
    }
    reserve() {
        if (this.status === SpotStatus.AVAILABLE) {
            this.status = SpotStatus.RESERVED;
            this.updatedAt = new Date();
        }
        else {
            throw new Error('Cannot reserve spot that is not available');
        }
    }
    occupy() {
        if (this.status === SpotStatus.AVAILABLE ||
            this.status === SpotStatus.RESERVED) {
            this.status = SpotStatus.OCCUPIED;
            this.updatedAt = new Date();
        }
        else {
            throw new Error('Cannot occupy spot that is not available or reserved');
        }
    }
    makeAvailable() {
        if (this.status !== SpotStatus.MAINTENANCE) {
            this.status = SpotStatus.AVAILABLE;
            this.updatedAt = new Date();
        }
    }
    setMaintenance() {
        this.status = SpotStatus.MAINTENANCE;
        this.updatedAt = new Date();
    }
    isAvailable() {
        return this.status === SpotStatus.AVAILABLE;
    }
    isOccupied() {
        return this.status === SpotStatus.OCCUPIED;
    }
    isReserved() {
        return this.status === SpotStatus.RESERVED;
    }
    isInMaintenance() {
        return this.status === SpotStatus.MAINTENANCE;
    }
    canAccommodateVehicle(vehicleType) {
        // Basic logic - can be extended based on business rules
        if (this.type === VehicleTypeEnum.MOTORCYCLE) {
            return vehicleType === VehicleTypeEnum.MOTORCYCLE;
        }
        if (this.type === VehicleTypeEnum.CAR) {
            return (vehicleType === VehicleTypeEnum.CAR ||
                vehicleType === VehicleTypeEnum.MOTORCYCLE);
        }
        if (this.type === VehicleTypeEnum.TRUCK) {
            return true; // Truck spots can accommodate all vehicle types
        }
        return this.type === vehicleType;
    }
    addAmenity(amenity) {
        if (!this.amenities.includes(amenity)) {
            this.amenities.push(amenity);
            this.updatedAt = new Date();
        }
    }
    removeAmenity(amenity) {
        const index = this.amenities.indexOf(amenity);
        if (index > -1) {
            this.amenities.splice(index, 1);
            this.updatedAt = new Date();
        }
    }
    updatePricing(pricing) {
        this.pricing = pricing;
        this.updatedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            zoneId: this.zoneId,
            number: this.number,
            type: this.type,
            status: this.status,
            coordinates: this.coordinates.toJSON(),
            amenities: this.amenities,
            pricing: this.pricing?.toJSON(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
export class LocationSettings {
    constructor(operatingHours, maxBookingDuration, // in minutes
    advanceBookingLimit, // in days
    allowOvernight = false, requirePrePayment = true) {
        Object.defineProperty(this, "operatingHours", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: operatingHours
        });
        Object.defineProperty(this, "maxBookingDuration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: maxBookingDuration
        });
        Object.defineProperty(this, "advanceBookingLimit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: advanceBookingLimit
        });
        Object.defineProperty(this, "allowOvernight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: allowOvernight
        });
        Object.defineProperty(this, "requirePrePayment", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: requirePrePayment
        });
    }
    static create(data) {
        return new LocationSettings(new OperatingHours(data.operatingHours), data.maxBookingDuration, data.advanceBookingLimit, data.allowOvernight, data.requirePrePayment);
    }
    update(data) {
        return new LocationSettings(data.operatingHours
            ? new OperatingHours(data.operatingHours)
            : this.operatingHours, data.maxBookingDuration ?? this.maxBookingDuration, data.advanceBookingLimit ?? this.advanceBookingLimit, data.allowOvernight ?? this.allowOvernight, data.requirePrePayment ?? this.requirePrePayment);
    }
    isCurrentlyOpen() {
        return this.operatingHours.isCurrentlyOpen();
    }
    isOpenAt(date) {
        return this.operatingHours.isOpenAt(date);
    }
    getMaxBookingEndTime() {
        const now = new Date();
        return new Date(now.getTime() + this.maxBookingDuration * 60 * 1000);
    }
    getMaxAdvanceBookingDate() {
        const now = new Date();
        return new Date(now.getTime() + this.advanceBookingLimit * 24 * 60 * 60 * 1000);
    }
    toJSON() {
        return {
            operatingHours: this.operatingHours.toJSON(),
            maxBookingDuration: this.maxBookingDuration,
            advanceBookingLimit: this.advanceBookingLimit,
            allowOvernight: this.allowOvernight,
            requirePrePayment: this.requirePrePayment,
        };
    }
}
export class OperatingHours {
    constructor(schedule) {
        Object.defineProperty(this, "schedule", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: schedule
        });
    }
    isCurrentlyOpen() {
        const now = new Date();
        return this.isOpenAt(now);
    }
    isOpenAt(date) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daySchedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
        if (!daySchedule || !daySchedule.isOpen) {
            return false;
        }
        if (daySchedule.is24Hours) {
            return true;
        }
        const currentTime = date.getHours() * 60 + date.getMinutes();
        const openTime = this.timeStringToMinutes(daySchedule.openTime);
        const closeTime = this.timeStringToMinutes(daySchedule.closeTime);
        if (closeTime < openTime) {
            // Overnight hours (e.g., 22:00 to 06:00)
            return currentTime >= openTime || currentTime <= closeTime;
        }
        else {
            // Same day hours (e.g., 08:00 to 18:00)
            return currentTime >= openTime && currentTime <= closeTime;
        }
    }
    timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    toJSON() {
        return {
            schedule: this.schedule,
        };
    }
}
// Enums
export var ParkingType;
(function (ParkingType) {
    ParkingType["HOSTED"] = "hosted";
    ParkingType["STREET"] = "street";
    ParkingType["FACILITY"] = "facility";
})(ParkingType || (ParkingType = {}));
export var SpotStatus;
(function (SpotStatus) {
    SpotStatus["AVAILABLE"] = "available";
    SpotStatus["OCCUPIED"] = "occupied";
    SpotStatus["RESERVED"] = "reserved";
    SpotStatus["MAINTENANCE"] = "maintenance";
})(SpotStatus || (SpotStatus = {}));
