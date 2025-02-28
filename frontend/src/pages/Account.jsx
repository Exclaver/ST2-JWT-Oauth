import React, { useEffect, useState } from 'react';

const Account = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Retrieve user info from local storage
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  if (!user) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="container">
      <h1>Account Page</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Full Name:</strong> {user.full_name}</p>
    </div>
  );
};

export default Account;