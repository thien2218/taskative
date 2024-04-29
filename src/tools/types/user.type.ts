export type User = {
   id: string;
   email: string;
   username: string;
   profileImage: string;
   emailVerified: boolean;
   createdAt: number;
   provider: string;
   providerId: string;
};

export type UserRefresh = User & {
   refreshToken: string;
};
