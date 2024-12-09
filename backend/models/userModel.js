const mongoose= require("mongoose");
const bcrypt= require("bcryptjs"); 
const crypto = require("crypto");
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pic: {
      type: String,
      default:
        "https://res.cloudinary.com/sravya/image/upload/v1726311060/dqoz4p7mfltzpkggqeet.jpg",
    },
    
    githubToken: { type: String,required: true },
  },
  { timestamps: true }
);
const secretKey = Buffer.from(process.env.SECRET_KEY, 'hex');
// Encryption function for githubToken
const encryptToken = (token) => {
  console.log(secretKey);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secretKey), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  console.log(encrypted);

  return encrypted;
};

userSchema.methods.matchPassword= async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.pre('save', async function(next) {
    if(!this.isModified){
        next();
    }
    const salt= await bcrypt.genSalt(10);
    this.password= await bcrypt.hash(this.password, salt);
    if (this.isModified("githubToken")) {
      this.githubToken = encryptToken(this.githubToken);
    }

    next();
});
const User= mongoose.model("User", userSchema);
module.exports=User;