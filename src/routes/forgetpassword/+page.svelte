<script>
  import { goto } from '$app/navigation';
  
  let email = '';

  async function handleSubmit() {
      // Add your logic for handling forgot password submission here
      // For demonstration purposes, let's just log the email
      console.log('Forgot Password Form Submitted with Email:', email);
  }
</script>

<style>
  /* Add CSS styles for the form and its elements */
  form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      margin-top: 50px;
      text-align: left; /* Align all text to the left */
      position: relative; /* Relative positioning for button alignment */
  }
  .form-group {
      display: flex;
      flex-direction: column; /* Stack label and input vertically */
      margin-bottom: 20px; /* Increase spacing between groups */
  }
  label {
      font-weight: bold;
      text-align: left; /* Align labels to the left */
      margin-bottom: 5px; /* Add space below labels */
  }
  input[type="email"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 16px;
  }
  button {
      background-color: transparent; /* Transparent background */
      color: rgb(92, 122, 154); /* Adjust color */
      padding: 5px; /* Adjust padding */
      border: none; /* Remove border */
      font-size: 16px; /* Adjust font size */
      cursor: pointer;
  }
  button:hover {
      text-decoration: underline; /* Underline on hover */
  }
  .submit-button {
      border: 1px solid rgb(92, 122, 154); /* Add border */
      border-radius: 5px; /* Add border-radius */
      background-color: rgb(92, 122, 154); /* Add background color */
      color: #fff; /* Change text color to white */
      padding: 10px 20px; /* Add padding */
      cursor: pointer; /* Change cursor to pointer */
      font-size: 16px; /* Adjust font size */
      width: 100%; /* Make button span the whole width */
  }
  .submit-button:hover {
      background-color: #5890df; /* Change background color on hover */
  }
</style>

<form on:submit|preventDefault={handleSubmit}>
  <div style="position: absolute; top: 10px; right: 10px;">
    <button on:click={() => goto('/')} style="font-size: 16px;">Go back</button>
  </div>
  <h1 style="font-size: 24px; font-weight: bold;">Forgot Password</h1>
  <p>Forgot your password?! We got you covered! Just enter your email in the space below!</p>
  <div class="form-group">
      <label for="email">Enter your email:</label>
      <input type="email" id="email" placeholder="Your Email" bind:value={email} required />
  </div>
  <button type="submit" class="submit-button" style="font-size: 16px; margin-top: 10px;">Submit</button>
</form>
