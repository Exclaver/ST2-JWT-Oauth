import React from 'react';

const Home = () => {
  return (
    <div className="container">
      <h1>Welcome to Select Text Chrome Extension</h1>
      <p>This is a simple and powerful tool to help you select and manage text efficiently.</p>
      <button onClick={() => window.location.href = '/signup'}>Get Started</button>
    </div>
  );
};

export default Home;