import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, default: '' },
    address: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      district: { type: String, default: '' },
      thana: { type: String, default: '' },
      area: { type: String, default: '' },
      house: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      deliveryInstructions: { type: String, default: '' },
      country: { type: String, default: 'Bangladesh' },
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
