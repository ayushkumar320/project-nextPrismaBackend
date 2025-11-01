import {NextRequest} from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import prisma from "@db/index";
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

interface SignupRequestBody {
  action: "signup";
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface LoginRequestBody {
  action: "login";
  email: string;
  password: string;
}

// Handle both signup and login
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {action} = body;

  if (action === "signup") {
    return handleSignup(body);
  } else if (action === "login") {
    return handleLogin(body);
  } else {
    return Response.json({
      status: {
        code: 400,
        message: "Invalid action",
      },
      message: {
        error: "Please specify 'signup' or 'login' action",
      },
    });
  }
}

// Register User
async function handleSignup(body: SignupRequestBody) {
  const {email, firstName, lastName, password} = body;
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (existingUser) {
    return Response.json({
      status: {
        code: 400,
        message: "User already exists",
      },
      message: {
        error: "User with this email already exists please login!",
      },
    });
  } else {
    const generateSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, generateSalt);
    const newUser = await prisma.user.create({
      data: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
      },
    });
    const token = jwt.sign(newUser, jwtSecret!);
    return Response.json({
      status: {
        code: 200,
        message: "User registered successfully",
      },
      message: {
        user: firstName,
        token: token,
      },
    });
  }
}

// Login User
async function handleLogin(body: LoginRequestBody) {
  const {email, password} = body;
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    return Response.json({
      status: {
        code: 400,
        message: "User does not exist",
      },
      message: {
        error: "User with this email does not exist please signup!",
      },
    });
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return Response.json({
        status: {
          code: 400,
          message: "Invalid password",
        },
        message: {
          error: "The password you entered is incorrect",
        },
      });
    } else {
      const token = jwt.sign(user, jwtSecret!);
      return Response.json({
        status: {
          code: 200,
          message: "Login successful",
        },
        message: {
          user: user.firstName,
          token: token,
        },
      });
    }
  }
}
