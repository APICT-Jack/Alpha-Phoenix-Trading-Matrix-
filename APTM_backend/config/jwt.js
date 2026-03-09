const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h', // or '7d' for longer sessions
};

export default jwtConfig;