const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwtConfig');
const bcrypt = require('bcrypt');
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function register(user) {
  const usersRef = db.collection('users');
  const existingUser = await usersRef.where('email', '==', user.email).get();

  if (!existingUser.empty) {
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  await usersRef.add(user);

  const token = jwt.sign({ email: user.email }, secret, { expiresIn });
  return { token, user };
}

async function login(email, password) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    throw new Error('Invalid email or password');
  }

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ email: user.email }, secret, { expiresIn });
  return { token, user };
}

module.exports = { register, login };
