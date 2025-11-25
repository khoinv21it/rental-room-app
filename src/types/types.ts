// Adress
//Province
export type Province = {
  id: number;
  name: string;
};
//District
export type District = {
  id: number;
  name: string;
  provinceId: number;
};
//Ward
export type Ward = {
  id: number;
  name: string;
  districtId: number;
};
// User Profile
export type UserProfile = {
  id: string;
  fullName?: string;
  avatar?: string;
  email?: string;
  phoneNumber?: string;
  address: {
    id: string;
    street: string;
    ward: {
      id: number;
      name: string;
      district: {
        id: number;
        name: string;
        province: {
          id: number;
          name: string;
        };
      };
    };
  };
};

// Notification
export type Notification = {
  id: string;
  receiverId: string;
  message: string;
  createdAt: any; // Firebase Timestamp
  isRead: boolean;
  type?: string;
  senderId?: string;
  data?: any;
  contractId?: string;
};
// Image
export type Image = {
  id: string;
  url: string;
};
export type LandLorForListRoom = {
  id: string;
  landlordProfile: {
    id: string;
    fullName?: string;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
  };
};
// Room
export type ListRoom = {
  id: string;
  images: Image[];
  title: string;
  priceMonth: number;
  area: number;
  address: {
    id?: string;
    street: string;
    ward: {
      id?: number;
      name: string;
      district: {
        id?: number;
        name: string;
        province: {
          id?: number;
          name: string;
        };
      };
    };
  };
  landlord: LandLorForListRoom;
  favoriteCount?: number;
  latitude?: number;
  longitude?: number;
  isVip?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  totalRecords: number;
};

export type ListRoomInMap = {
  id: string;
  title: string;
  imageUrl: string;
  area: number;
  priceMonth: number;
  postType: string;
  fullAddress: string;
  lng: number;
  lat: number;
};

// Requirement Types
export interface RequirementDetail {
  id: string;
  roomTitle: string;
  userName: string;
  email: string;
  description: string;
  status: 0 | 1 | 2; // 0 = Not Processed, 1 = Completed, 2 = Rejected
  imageUrl?: string;
  createdDate: string;
}

export interface RequirementRequestRoomDto {
  idRequirement?: string;
  userId: string;
  roomId: string;
  description: string;
}

export interface UpdateRequestRoomDto {
  id: string;
  description: string;
}

export type RoomDetail = {
  id: string;
  title: string;
  description: string;
  priceMonth: number;
  priceDeposit: number;
  area: number;
  roomLength: number;
  roomWidth: number;
  elecPrice: number;
  waterPrice: number;
  maxPeople: number;
  postStartDate: string;
  postEndDate: string;
  address: {
    id?: string;
    street: string;
    ward: {
      id?: number;
      name: string;
      district: {
        id?: number;
        name: string;
        province: {
          id?: number;
          name: string;
        };
      };
    };
  };
  images: Image[];
  convenients: Convenient[];
  typepost: string;
  userId: string;
  favoriteCount: number;
  viewCount: number;
};

export type Convenient = {
  id: string;
  name: string;
};
export type LandLordByRoomId = {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  amountPost: number;
  phone: string;
  createDate: string;
};
export type RequestBooking = {
  roomId: string;
  rentalDate: string;
  rentalExpires: string;
  tenantCount: number;
};

export type ListContract = {
  id: string;
  roomTitle: string;
  landlordName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: string;
};

export type ContractDetail = {
  id: string;
  contractName: string;
  roomId: string;
  roomTitle: string;
  tenantId: string;
  tenantName: string;
  tenantPhone?: string;
  landlordId: string;
  landlordName: string;
  depositAmount: number;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  status: number;
  contractImage?: string;
  landlordPaymentInfo: {
    bankName: string;
    bankNumber: string;
    binCode: string;
    accountHolderName: string;
    phoneNumber: string;
  };
};

export type TenantInfo = {
  id: string;
  name: string;
  phone?: string;
  roomTitle?: string;
};

export type LandlordPaymentInfo = {
  bankName: string;
  bankNumber: string;
  binCode: string;
  accountHolderName: string;
  phoneNumber: string;
  depositAmount?: number;
  email?: string;
};
export type Bill = {
  id: string;
  month: string;
  electricityPrice: number;
  electricityUsage: number;
  electricityFee: number;
  waterPrice: number;
  waterUsage: number;
  waterFee: number;
  damageFee: number;
  note: string | null;
  serviceFee: number;
  totalAmount: number;
  status: string;
  imageProof: string | null;
};

// Resident Types
export interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  relationship: string;
  startDate: string;
  endDate: string;
  note?: string;
  status: string;
  contractId: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
}

// Booking Types
export interface BookingData {
  bookingId: string;
  roomName: string;
  roomId: string;
  address: string;
  rentalDate: string;
  rentalExpires: string;
  tenantCount: number;
  monthlyRent: number;
  status: number;
  isRemoved: number;
  landlordName: string;
  landlordPhone: string;
  imageProof?: string;
}

// Contract Info
export interface ContractInfo {
  id: string;
  contractName?: string;
  roomTitle?: string;
  roomAddress?: string;
  monthlyRent?: number;
  startDate?: string;
  endDate?: string;
}
