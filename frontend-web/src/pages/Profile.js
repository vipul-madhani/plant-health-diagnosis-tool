import React from 'react';

function Profile() {
  return (
    <main className="profile-container">
      <h1>Your Profile</h1>
      <form className="profile-form">
        <label>Name <input type="text" defaultValue="Test User" /></label>
        <label>Email <input type="email" defaultValue="test@email.com" /></label>
        <label>Phone <input type="tel" defaultValue="9876543210" /></label>
        <button type="submit">Save Changes</button>
      </form>
      <section style={{ marginTop: 40 }}>
        <h2>Account Actions</h2>
        <button>Change Password</button>
        <button disabled>Delete Account (coming soon)</button>
      </section>
    </main>
  );
}
export default Profile;
