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
  }
}
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

export type ListRoomInMap = 
    {
        id: string,
        title: string,
        imageUrl: string,
        area: number,
        priceMonth: number,
        postType: string,
        fullAddress: string,
        lng: number,
        lat: number
    };


export type RoomDetail = {
   id: string,
    title: string,
    description: string,
    priceMonth: number,
    priceDeposit: number,
    area: number,
    roomLength: number,
    roomWidth: number,
    elecPrice: number,
    waterPrice: number,
    maxPeople: number,
    postStartDate: string,
    postEndDate: string,
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
      },
    images: Image[],
    convenients: Convenient[],
    typepost: string,
    userId: string,
    favoriteCount: number,
    viewCount: number,
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
