const allowedOrigins = [
  "http://localhost:3000",
  "https://udharkhata.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // console.log("CORS origin:", origin);
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
