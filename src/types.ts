export type Role = "ADMIN" | "USER" | "SECURITY";

export type TicketType = 'DAILY' | 'MONTHLY' | 'RESERVED';

export type TicketStatus = 'AVAILABLE' | 'INUSE' | 'LOST' | 'CANCELED';

export type VehicleType = 'MOTORBIKE' | 'CAR';

export interface BaseModel {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface User extends Omit<BaseModel, "createdAt" | "updatedAt"> {
  username: string;
  name: string;
  email: string;
  role: Role;
}

export interface Section extends BaseModel {
  name: string;
  capacity: number;
}

export interface CreateSection extends Omit<Section, "id" | "createdAt" | "updatedAt"> { };

export interface Notification extends BaseModel {
  from: {
    id: number;
    username: string;
    name: string;
  };
  message: string;
  status: string;
}

export interface Residence extends BaseModel {
  building: string;
  room: number;
  vehicles?: Vehicle[];
  residents?: Resident[];
};

export interface CreateResidence extends Omit<Residence, "id" | "createdAt" | "updatedAt"> { };

export interface Vehicle extends BaseModel {
  plate: string;
  type: string;
};

export type CreateVehicle = Omit<Vehicle, "id" | "createdAt" | "updatedAt">

export type Resident = {
  id: number;
  name: string;
};

export interface Pricing {
  type: TicketType;
  vehicleType: VehicleType;
  price: number;
}

export interface Ticket extends BaseModel {
  type: TicketType;
  status: TicketStatus;
  vehicleId?: number;
  userId?: number;
}

export interface CreateTicket {
  type: TicketType | null;
  userId?: number;
  vehicleId?: number;
  sectionId?: number;
  slot?: number;
}

export interface UpdateTicket {
  type: TicketType;
  status: TicketStatus;
}

export interface ReserveTicket {
  sectionId: number;
  slot: number;
}

export interface Transaction extends BaseModel {
  userId: number;
  amount: number;
  status: "PENDING" | "PAID";
  month: number;
  year: number;
}

export interface BaseParking {
  sectionId: number | string;
  ticketId: number | string;
  plate: string;
}

export interface CheckIn extends BaseParking {
  type: string;
}

export interface CheckOut extends BaseParking { }

export interface Response<T> {
  maxPage: number;
  data: T[];
  message?: string;
}

export interface NotificationResponse extends Response<Notification> { }
export interface TransactionResponse extends Response<Transaction> { }
export interface TicketResponse extends Response<Ticket> { }
export interface ResidenceResponse extends Response<Residence> { }
export interface VehicleResponse extends Response<Vehicle> { }



