const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", maxLength: 255 },
      password: { type: "string", minLength: 8, maxLength: 128 },
      name: { type: "string", minLength: 2, maxLength: 50 },
    },
    additionalProperties: false,
  },
};

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

const refreshTokenSchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

const logoutSchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

const updateUserSchema = {
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50 },
      password: { type: "string", minLength: 8, maxLength: 128 },
      profileImageUrl: { type: "string", maxLength: 2048 },
    },
    additionalProperties: false,
  },
};

const paginationSchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
  },
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  updateUserSchema,
  paginationSchema,
  forgotPasswordSchema: {
    body: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email", maxLength: 255 },
      },
      additionalProperties: false,
    },
  },
  verifyOtpSchema: {
    body: {
      type: "object",
      required: ["email", "otp"],
      properties: {
        email: { type: "string", format: "email", maxLength: 255 },
        otp: {
          type: "string",
          minLength: 6,
          maxLength: 6,
          pattern: "^[0-9]{6}$",
        },
      },
      additionalProperties: false,
    },
  },
  resetPasswordSchema: {
    body: {
      type: "object",
      required: ["newPassword"],
      properties: {
        newPassword: { type: "string", minLength: 8, maxLength: 128 },
      },
      additionalProperties: false,
    },
  },
  updateProfileSchema: {
    body: {
      type: "object",
      minProperties: 1,
      properties: {
        name: { type: "string", minLength: 2, maxLength: 50 },
        email: { type: "string", format: "email", maxLength: 255 },
        profileImageUrl: { type: "string", maxLength: 2048 },
      },
      additionalProperties: false,
    },
  },
  changePasswordSchema: {
    body: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string", minLength: 1 },
        newPassword: { type: "string", minLength: 8, maxLength: 128 },
      },
      additionalProperties: false,
    },
  },
};
