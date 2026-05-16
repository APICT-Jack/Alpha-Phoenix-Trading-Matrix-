//this script was created by jack {Mthandeni Mnyandu} copyrigh 2024, all rights reserved. this script is used to configure the JSON Web Token (JWT) settings for the application. it defines the secret key and the expiration time for the JWT tokens. the secret key is used to sign and verify the tokens, while the expiration time determines how long the tokens are valid before they expire.
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h', // or '7d' for longer sessions
};

export default jwtConfig;