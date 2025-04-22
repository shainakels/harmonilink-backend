const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const profileRoute = require('./routes/profile'); // Import the profile route
const mixtapeRoute = require('./routes/mixtape'); // Import the mixtape route

const app = express();
app.use(cors());
app.use(bodyParser.json());


// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Harmonilink API!');
});

// Use routes
app.use('/api', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api', profileRoute); // Use the profile route
app.use('/api', mixtapeRoute); // Register the mixtape route


app.listen(3000, () => console.log('Server running on port 3000'));
