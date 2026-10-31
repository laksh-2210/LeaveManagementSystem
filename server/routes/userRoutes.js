
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 1. USER REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const {
            username,
            email,
            rollNumber,
            casualLeave,
            medicalLeave
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const newUser = new User({
            username,
            email,
            rollNumber,
            casualLeave: casualLeave ?? 10,
            medicalLeave: medicalLeave ?? 10
        });

        await newUser.save();

        res.status(201).json({
            message: "Registration successful",
            user: newUser
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 2. USER LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Login successful",
            user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 3. GET LEAVE BALANCE
router.get("/leave-balance/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 4. APPLY LEAVE
router.post("/apply-leave/:id", async (req, res) => {
    try {
        const { leaveType, days, leaveReason } = req.body;

        if (!Number.isInteger(days) || days <= 0) {
            return res.status(400).json({
                message: "Enter a valid number of days"
            });
        }

        if (!leaveReason || !leaveReason.trim()) {
            return res.status(400).json({
                message: "Please enter the reason for leave"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (leaveType === "casual") {
            if (user.casualLeave < days) {
                return res.status(400).json({
                    message: "Insufficient casual leave"
                });
            }

            user.casualLeave -= days;

        } else if (leaveType === "medical") {
            if (user.medicalLeave < days) {
                return res.status(400).json({
                    message: "Insufficient medical leave"
                });
            }

            user.medicalLeave -= days;

        } else {
            return res.status(400).json({
                message: "Invalid leave type"
            });
        }

        user.leaveApplications.push({
            leaveType,
            days,
            leaveReason: leaveReason.trim(),
            appliedDate: new Date(),
            status: "Pending",
            rejectionReason: ""
        });

        await user.save();

        res.json({
            message: "Leave applied successfully",
            casualLeave: user.casualLeave,
            medicalLeave: user.medicalLeave,
            leaveApplications: user.leaveApplications
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 5. GET STUDENT LEAVE APPLICATIONS
router.get("/leave-applications/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            leaveApplications: user.leaveApplications
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 6. STAFF - VIEW ALL LEAVE APPLICATIONS
router.get("/staff/leave-applications", async (req, res) => {
    try {
        const users = await User.find();

        const applications = [];

        users.forEach((user) => {
            user.leaveApplications.forEach((leave) => {
                applications.push({
                    userId: user._id,
                    leaveId: leave._id,
                    username: user.username,
                    email: user.email,
                    rollNumber: user.rollNumber,
                    leaveType: leave.leaveType,
                    days: leave.days,
                    leaveReason: leave.leaveReason,
                    appliedDate: leave.appliedDate,
                    status: leave.status,
                    rejectionReason: leave.rejectionReason
                });
            });
        });

        res.json({
            message: "Leave applications fetched successfully",
            applications
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 7. STAFF - APPROVE LEAVE
router.put(
    "/staff/approve-leave/:userId/:leaveId",
    async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);

            if (!user) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            const leave = user.leaveApplications.id(
                req.params.leaveId
            );

            if (!leave) {
                return res.status(404).json({
                    message: "Leave application not found"
                });
            }

            if (leave.status !== "Pending") {
                return res.status(400).json({
                    message: "This leave application is already processed"
                });
            }

            leave.status = "Approved";
            leave.rejectionReason = "";

            await user.save();

            res.json({
                message: "Leave approved successfully",
                status: leave.status
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// 8. STAFF - REJECT LEAVE WITH REASON
router.put(
    "/staff/reject-leave/:userId/:leaveId",
    async (req, res) => {
        try {
            const { rejectionReason } = req.body;

            if (!rejectionReason || !rejectionReason.trim()) {
                return res.status(400).json({
                    message: "Please enter the rejection reason"
                });
            }

            const user = await User.findById(req.params.userId);

            if (!user) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            const leave = user.leaveApplications.id(
                req.params.leaveId
            );

            if (!leave) {
                return res.status(404).json({
                    message: "Leave application not found"
                });
            }

            if (leave.status !== "Pending") {
                return res.status(400).json({
                    message: "This leave application is already processed"
                });
            }

            // Restore leave balance
            if (leave.leaveType === "casual") {
                user.casualLeave += leave.days;

            } else if (leave.leaveType === "medical") {
                user.medicalLeave += leave.days;
            }

            // Save rejection details
            leave.status = "Rejected";
            leave.rejectionReason = rejectionReason.trim();

            await user.save();

            res.json({
                message: "Leave rejected successfully",
                status: leave.status,
                rejectionReason: leave.rejectionReason,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


module.exports = router;
