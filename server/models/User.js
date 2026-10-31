
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    rollNumber: {
        type: String,
        required: true
    },

    casualLeave: {
        type: Number,
        default: 10
    },

    medicalLeave: {
        type: Number,
        default: 10
    },

    // Leave Application Details
    leaveApplications: [
        {
            leaveType: {
                type: String,
                required: true
            },

            days: {
                type: Number,
                required: true
            },

            leaveReason: {
                type: String,
                required: true
            },

            appliedDate: {
                type: Date,
                default: Date.now
            },

            status: {
                type: String,
                default: "Pending"
            },

            rejectionReason: {
                type: String,
                default: ""
            }
        }
    ]
});

const User = mongoose.model("User", userSchema);

module.exports = User;
