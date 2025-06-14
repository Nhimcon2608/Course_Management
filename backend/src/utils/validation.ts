import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('student', 'instructor').required().messages({
    'any.only': 'Role must be either student or instructor',
    'any.required': 'Role selection is required'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Password change validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password cannot exceed 128 characters',
    'any.required': 'New password is required'
  })
});

// Forgot password validation schema
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Reset password validation schema
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  })
});

// Verify reset token validation schema
export const verifyResetTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  })
});

// Send email verification validation schema
export const sendEmailVerificationSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  })
});

// Verify email token validation schema
export const verifyEmailTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required'
  })
});

// Update email validation schema
export const updateEmailSchema = Joi.object({
  newEmail: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'New email address is required'
  })
});

// Course validation schemas
export const createCourseSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Course title must be at least 5 characters long',
    'string.max': 'Course title cannot exceed 200 characters',
    'any.required': 'Course title is required'
  }),
  description: Joi.string().min(50).required().messages({
    'string.min': 'Course description must be at least 50 characters long',
    'any.required': 'Course description is required'
  }),
  shortDescription: Joi.string().min(20).max(500).required().messages({
    'string.min': 'Short description must be at least 20 characters long',
    'string.max': 'Short description cannot exceed 500 characters',
    'any.required': 'Short description is required'
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required'
  }),
  originalPrice: Joi.number().min(0).optional(),
  category: Joi.string().required().messages({
    'any.required': 'Category is required'
  }),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').required().messages({
    'any.only': 'Level must be one of: beginner, intermediate, advanced',
    'any.required': 'Course level is required'
  }),
  duration: Joi.number().min(0.5).required().messages({
    'number.min': 'Duration must be at least 0.5 hours',
    'any.required': 'Course duration is required'
  }),
  requirements: Joi.array().items(Joi.string()).optional(),
  whatYouWillLearn: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one learning outcome is required',
    'any.required': 'Learning outcomes are required'
  }),
  tags: Joi.array().items(Joi.string()).optional()
});

export const updateCourseSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(50).optional(),
  shortDescription: Joi.string().min(20).max(500).optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  category: Joi.string().optional(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  duration: Joi.number().min(0.5).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  whatYouWillLearn: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional()
});

// Category validation schemas
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Category name must be at least 2 characters long',
    'string.max': 'Category name cannot exceed 50 characters',
    'any.required': 'Category name is required'
  }),
  description: Joi.string().max(500).optional(),
  parentCategory: Joi.string().optional()
});

// Review validation schemas
export const createReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  comment: Joi.string().max(1000).optional()
});

// Query validation schemas
export const querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  search: Joi.string().optional(),
  category: Joi.string().optional(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  rating: Joi.number().min(1).max(5).optional()
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};
