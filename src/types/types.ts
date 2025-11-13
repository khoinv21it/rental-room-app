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