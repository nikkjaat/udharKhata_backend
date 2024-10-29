

const allowedOrigins = [
  "http://localhost:3000",
  "https://udhar-khata-frontend.vercel.app",
  "https://udharkhata.netlify.app",
  "https://udhaarkhatafrontend.netlify.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, origin); // Use the exact origin
    } else {
      callback(new Error("Not allowed to access"));
    }
  },
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200,
};






// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://udhar-khata-frontend.vercel.app",
//   "https://udharkhata.netlify.app",
//   "https://udhaarkhatafrontend.netlify.app"
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed to access"));
//     }
//   },
//   credentials: true, // Allow credentials
//   optionsSuccessStatus: 200,
// }
