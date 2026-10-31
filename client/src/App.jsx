
import { useState } from "react";
import "./App.css";

const API = "http://localhost:5001/api";

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    rollNumber: "",
    casualLeave: 10,
    medicalLeave: 10
  });

  const [email, setEmail] = useState("");
  const [leaveType, setLeaveType] = useState("casual");
  const [days, setDays] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [leaveApplications, setLeaveApplications] = useState([]);
  const [staffApplications, setStaffApplications] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState({});

  // 1. REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Registration successful! Please login.");
      setIsRegister(false);
      setEmail(registerData.email);

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 2. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setUser(data.user);

      const leaveResponse = await fetch(
        `${API}/leave-applications/${data.user._id}`
      );

      const leaveData = await leaveResponse.json();

      if (leaveResponse.ok) {
        setLeaveApplications(leaveData.leaveApplications || []);
      }

      setMessage("Login successful!");

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 3. APPLY LEAVE
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        `${API}/apply-leave/${user._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leaveType,
            days: Number(days),
            leaveReason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setUser({
        ...user,
        casualLeave: data.casualLeave,
        medicalLeave: data.medicalLeave
      });

      setLeaveApplications(data.leaveApplications || []);

      setDays("");
      setLeaveReason("");

      setMessage(data.message);

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 4. STAFF - FETCH ALL APPLICATIONS
  const handleStaffPortal = async () => {
    setMessage("");

    try {
      const response = await fetch(
        `${API}/staff/leave-applications`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setStaffApplications(data.applications || []);
      setIsStaff(true);

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 5. STAFF - APPROVE LEAVE
  const handleApprove = async (application) => {
    try {
      const response = await fetch(
        `${API}/staff/approve-leave/${application.userId}/${application.leaveId}`,
        {
          method: "PUT"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(data.message);
      await refreshStaffApplications();

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 6. STAFF - REJECT LEAVE
  const handleReject = async (application) => {
    const reason = rejectionReasons[application.leaveId];

    if (!reason || !reason.trim()) {
      setMessage("Please enter the rejection reason.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/staff/reject-leave/${application.userId}/${application.leaveId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectionReason: reason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(data.message);

      setRejectionReasons({
        ...rejectionReasons,
        [application.leaveId]: ""
      });

      await refreshStaffApplications();

    } catch (error) {
      setMessage("Cannot connect to backend.");
    }
  };

  // 7. REFRESH STAFF APPLICATIONS
  const refreshStaffApplications = async () => {
    try {
      const response = await fetch(
        `${API}/staff/leave-applications`
      );

      const data = await response.json();

      if (response.ok) {
        setStaffApplications(data.applications || []);
      }
    } catch (error) {
      setMessage("Unable to refresh applications.");
    }
  };

  // 8. LOGOUT
  const handleLogout = () => {
    setUser(null);
    setEmail("");
    setMessage("");
    setIsStaff(false);
    setLeaveApplications([]);
    setStaffApplications([]);
  };

  return (
    <div className="app">

      <header>
        <h1>Leave Management System</h1>
        <p>Student and Staff Portal</p>
      </header>

      <main>

        {!user ? (

          isStaff ? (

            // STAFF PORTAL
            <section className="dashboard">

              <h2>Staff Portal</h2>
              <p>Manage Student Leave Applications</p>

              <button onClick={refreshStaffApplications}>
                Refresh Applications
              </button>

              <h3>All Leave Applications</h3>

              {staffApplications.length === 0 ? (
                <p>No leave applications found.</p>
              ) : (

                <div style={{ overflowX: "auto" }}>

                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Roll Number</th>
                        <th>Leave Type</th>
                        <th>Days</th>
                        <th>Applied Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Rejection Message</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {staffApplications.map((application) => (

                        <tr key={application.leaveId}>

                          <td>{application.username}</td>

                          <td>{application.rollNumber}</td>

                          <td>{application.leaveType}</td>

                          <td>{application.days}</td>

                          <td>
                            {new Date(
                              application.appliedDate
                            ).toLocaleDateString("en-IN")}
                          </td>

                          <td>{application.leaveReason}</td>

                          <td>{application.status}</td>

                          <td>
                            {application.rejectionReason || "-"}
                          </td>

                          <td>

                            {application.status === "Pending" ? (

                              <div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApprove(application)
                                  }
                                >
                                  Approve
                                </button>

                                <textarea
                                  placeholder="Enter rejection reason"
                                  value={
                                    rejectionReasons[
                                      application.leaveId
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setRejectionReasons({
                                      ...rejectionReasons,
                                      [application.leaveId]:
                                        e.target.value
                                    })
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReject(application)
                                  }
                                >
                                  Reject
                                </button>

                              </div>

                            ) : (
                              <span>Processed</span>
                            )}

                          </td>

                        </tr>

                      ))}

                    </tbody>
                  </table>

                </div>

              )}

              <button
                className="logout"
                onClick={handleLogout}
              >
                Back to Login
              </button>

            </section>

          ) : (

            // STUDENT LOGIN / REGISTRATION
            <section className="form-card">

              <h2>
                {isRegister ? "User Registration" : "User Login"}
              </h2>

              {isRegister ? (

                <form onSubmit={handleRegister}>

                  <input
                    type="text"
                    placeholder="Username"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={registerData.rollNumber}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        rollNumber: e.target.value
                      })
                    }
                    required
                  />

                  <label>Casual Leave</label>

                  <input
                    type="number"
                    min="0"
                    value={registerData.casualLeave}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        casualLeave: Number(e.target.value)
                      })
                    }
                    required
                  />

                  <label>Medical Leave</label>

                  <input
                    type="number"
                    min="0"
                    value={registerData.medicalLeave}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        medicalLeave: Number(e.target.value)
                      })
                    }
                    required
                  />

                  <button type="submit">Register</button>

                </form>

              ) : (

                <form onSubmit={handleLogin}>

                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <button type="submit">Login</button>

                </form>

              )}

              <p className="switch">

                {isRegister
                  ? "Already registered?"
                  : "New user?"}{" "}

                <span
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setMessage("");
                  }}
                >
                  {isRegister ? "Login here" : "Register here"}
                </span>

              </p>

              <div className="form-card">

                <h3>Staff Access</h3>

                <p>Open the staff leave management portal.</p>

                <button
                  type="button"
                  onClick={handleStaffPortal}
                >
                  Staff Portal
                </button>

              </div>

            </section>

          )

        ) : (

          // STUDENT DASHBOARD
          <section className="dashboard">

            <h2>Welcome, {user.username}!</h2>

            <p>Roll Number: {user.rollNumber}</p>
            <p>Email: {user.email}</p>

            <h3>Leave Balance</h3>

            <div className="balance">

              <div className="balance-card">
                <h4>Casual Leave</h4>
                <h2>{user.casualLeave}</h2>
              </div>

              <div className="balance-card">
                <h4>Medical Leave</h4>
                <h2>{user.medicalLeave}</h2>
              </div>

            </div>

            <div className="form-card">

              <h3>Apply Leave</h3>

              <form onSubmit={handleApplyLeave}>

                <label>Leave Type</label>

                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="casual">Casual Leave</option>
                  <option value="medical">Medical Leave</option>
                </select>

                <label>Number of Days</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter number of days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  required
                />

                <label>Reason for Leave</label>

                <textarea
                  placeholder="Enter your reason for leave"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                />

                <button type="submit">Apply Leave</button>

              </form>

            </div>

            <div className="form-card">

              <h3>My Leave Applications</h3>

              {leaveApplications.length === 0 ? (

                <p>No leave applications found.</p>

              ) : (

                <div style={{ overflowX: "auto" }}>

                  <table>

                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Days</th>
                        <th>Applied Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Rejection Message</th>
                      </tr>
                    </thead>

                    <tbody>

                      {leaveApplications.map((leave, index) => (

                        <tr key={leave._id || index}>

                          <td>{leave.leaveType}</td>
                          <td>{leave.days}</td>

                          <td>
                            {new Date(
                              leave.appliedDate
                            ).toLocaleDateString("en-IN")}
                          </td>

                          <td>{leave.leaveReason}</td>
                          <td>{leave.status}</td>

                          <td>
                            {leave.rejectionReason || "-"}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            <button
              className="logout"
              onClick={handleLogout}
            >
              Logout
            </button>

          </section>

        )}

        {message && (
          <p className="message">{message}</p>
        )}

      </main>

    </div>
  );
}

export default App;
