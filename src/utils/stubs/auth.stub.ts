import { JwtPayload, LoginDto, SignupDto } from "utils/types";

export const tokensStub = () => ({
   accessToken: "signedToken",
   refreshToken: "signedToken"
});

export const signupStub = (): SignupDto => ({
   email: "test@gmail.com",
   password: "password",
   firstName: "Test",
   lastName: "User",
   profileImage: "https://example.com"
});

export const loginStub = (): LoginDto => ({
   email: "test@gmail.com",
   password: "password"
});

export const jwtPayloadStub = (): JwtPayload => ({
   sub: "123",
   email: "test@gmail.com",
   firstName: "Test",
   lastName: "User",
   profileImage: "image",
   exp: Date.now() / 1000
});

export const oauthStub = () => ({
   email: "test@gmail.com",
   provider: "google" as "google" | "facebook",
   firstName: "Test",
   profileImage: "image",
   lastName: "User"
});
