const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already (Or did you forget your password???) please try to login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
   try {
    hashedPassword = await bcrypt.hash(password, 12);
   } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again', 
      500
    );
    return next(error)
   }
 

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
    console.log(`Hashed password ${hashedPassword}`);
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  //Check jsonwebtoken docs!  there is a 3rd argument for below, enabling expiresIn: , etc

  try {
  token = jwt.sign(
    { userId:createdUser.id, email:createdUser.email },process.env.JWT_KEY,
      {expiresIn: '8hr'} 
      );
  } catch (err) {
    const error = new HttpError(
      'Unable to process dehashing??? on Signup problem with code?',
       500
    );
    return next (error);
  }

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  //trying to find a user. if somethings wrong internally, this will fire
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Loggin in failed, please try again later.',
      500
    );
    return next(error);
  }

  //checkin if existin user
  if (!existingUser) {
    const error = new HttpError(
      'It looks like you typed something wrong? Could not log you in.',
      403
    );
    return next(error);
  }

  // checkin password
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError (
      'Could not log you in, could be password? or could be a bug!?!?! (I Think its a Bug!)', 500
    );
    return next(error);

  };

  if (!isValidPassword) {
    const error = new HttpError(
      'Password is wrong!.',
      401
    );
    return next(error);
  }

  // checkin jwt
  let token;
  //Check jsonwebtoken docs!  there is a 3rd argument for below, enabling expiresIn: , etc

  try {
  token = jwt.sign(
    { userId:existingUser.id, userEmail:existingUser.email }, process.env.JWT_KEY,
      {expiresIn: '8hr'} 
      );
  } catch {
    const error = new HttpError(
      'Unable to process dehashing (JWT Sign) on Login??? problem with code?',
       500
    );
    return next (error);
    
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
