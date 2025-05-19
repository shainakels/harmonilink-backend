const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const profileRoute = require('./routes/profile'); // Import profile route
const mixtapeRoute = require('./routes/mixtape');
const authRoute = require('./routes/auth'); // Import auth route
const forgotPasswordRoute = require('./routes/forgot-password'); // Import forgot-password route
const resetPasswordRoute = require('./routes/reset-password'); // Import reset-password route
const discoverRoute = require('./routes/discover'); // Import discover route
const discardRoute = require('./routes/discard'); // Import discard route
const favoritesRoute = require('./routes/favorites'); // Import favorites route
const errorHandler = require('./middleware/errorHandler'); // Import error handler middleware
const https = require('https');
const fs = require('fs');
const path = require('path'); // Import path module
const app = express();
const createMixtapeRoutes = require('./routes/create-mixtape');
const uploadRouter = require('./routes/upload');

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Harmonilink API!');
});

// Use routes under /api
app.use('/api', signupRoute);
app.use('/api', loginRoute);
app.use('/api', profileRoute); // Register profile route
app.use('/api', createMixtapeRoutes);
app.use('/api', mixtapeRoute);
app.use('/api/auth', authRoute); // Register auth route
app.use('/api/forgot-password', forgotPasswordRoute); // Register forgot-password route
app.use('/api/reset-password', resetPasswordRoute); // Register reset-password route
app.use('/api', discoverRoute); // Register discover route
app.use('/api', discardRoute); // Register discard route
app.use('/api', favoritesRoute); // Register the favorites route


// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Other middleware/routes...
app.use('/api/upload', require('./routes/upload')); // adjust path as needed


const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('path/to/private.key'),
    cert: fs.readFileSync('path/to/certificate.crt'),
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.use(errorHandler);

