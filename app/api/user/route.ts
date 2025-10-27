import {NextRequest} from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {PrismaClient} from "@prisma/client/extension";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET;


// Register User
export async function POST_signup(request: NextRequest) {
  const {email, firstName, lastName, password} = await request.json();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email
    }
  });
  if (existingUser) {
    return Response.json({
      status: {
        code: 400,
        message: "User already exists"
      }, message: {
        error: "User with this email already exists please login!"
      }
    })
  } else {
    const generateSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, generateSalt);
    const newUser = await prisma.user.create({
      data: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword
      }
    });
    const token = jwt.sign(newUser, jwtSecret!);
    return Response.json({
      status: {
        code: 200,
        message: "User registered successfully"
      }, message: {
        user: firstName,
        token: token
      }
    })
  }
}

// Login User 
export async function POST_login(request: NextRequest) {
  const {email, password} = await request.json();
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });
  if (!user) {
    return Response.json({
      status: {
        code: 400,
        message: "User does not exist"
      }, message: {
        error: "User with this email does not exist please signup!"
      }
    })
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return Response.json({
        status: {
          code: 400,
          message: "Invalid password"
        }, message: {
          error: "The password you entered is incorrect"
        }
      })
    } else {
      const token = jwt.sign(user, jwtSecret!);
      return Response.json({
        status: {
          code: 200,
          message: "Login successful"
        }, message: {
          user: user.firstName,
          token: token
        }
      })
    }
  }
}