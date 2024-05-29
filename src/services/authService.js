const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Firestore } = require('@google-cloud/firestore');
const { secret, expiresIn } = require('../config/jwtConfig');

const db = new Firestore();
const usersCollection = db.collection('users');

async function registerUser(userData) {
  const { name, email, gender, birth_date, password } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const userDoc = await usersCollection.doc(email).get();
  if (userDoc.exists) {
    throw new Error('Email already exists');
  }

  await usersCollection.doc(email).set({
    name,
    email,
    gender,
    birth_date,
    password: hashedPassword,
    email_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const payload = { email };
  const token = jwt.sign(payload, secret, { expiresIn });

  return {
    access_token: token,
    token_type: 'bearer',
    user: {
      name,
      email,
      gender,
      birth_date,
      email_verified: false
    }
  };
}

async function loginUser({ email, password }) {
  const userDoc = await usersCollection.doc(email).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data();
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Password is incorrect');
  }

  const payload = { email };
  const token = jwt.sign(payload, secret, { expiresIn });

  return {
    access_token: token,
    token_type: 'bearer',
    user: {
      name: user.name,
      email: user.email,
      gender: user.gender,
      birth_date: user.birth_date,
      email_verified: user.email_verified
    }
  };
}

module.exports = {
  registerUser,
  loginUser,
};
