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

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Harmonilink API!');
});

// Use routes under /api
app.use('/api', signupRoute);
app.use('/api', loginRoute);
app.use('/api', profileRoute); // Register profile route
app.use('/api', mixtapeRoute);
app.use('/api/auth', authRoute); // Register auth route
app.use('/api/forgot-password', forgotPasswordRoute); // Register forgot-password route
app.use('/api/reset-password', resetPasswordRoute); // Register reset-password route

app.listen(3000, () => console.log('Server running on port 3000'));
