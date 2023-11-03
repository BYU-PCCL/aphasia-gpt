
<script lang="ts">
   import {goto} from '$app/navigation'
  let email = '';
  let password = '';
  let repeatPassword = '';
  let name = '';
  let age = '';
  let about = '';

  function handleSubmit() {
    // Here, you can send the form data to your backend or database using an HTTP request.
    // Example:
    const formData = {
      email,
      password,
      name,
      age: parseInt(age), // Convert age to a number
      about,
    };

    // Send the formData to your backend for storage
    fetch('/your-api-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(response => {
        if (response.ok) {
          // Handle success, e.g., show a success message
          console.log('Data saved successfully.');
        } else {
          // Handle errors, e.g., display an error message
          console.error('Error saving data.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
</script>


  
  <form on:submit={handleSubmit}>
    <div class="form-group">
      <label for="email">Email:</label>
      <input type="email" id="email" bind:value={email} required />
    </div>

    <div class="form-group">
      <label for="email">Password: </label>
      <input type="password" id="password" bind:value={password} required />
    </div>

    <div class="form-group">
      <label for="email">Repeat password: </label>
      <input type="password" id="repeatpassword" bind:value={repeatPassword} required />
    </div>


    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" bind:value={name} required />
    </div>
  
  
    <div class="form-group">
      <label for="age">Age:</label>
      <input type="number" id="age" bind:value={age} required />
    </div>
  
    <div class="form-group">
      <label for="about">Tell Us About Yourself!</label>
      <textarea id="about" bind:value={about} rows="4"></textarea>
    </div>
  
    <button type="submit" style="display: inline-block;">Submit</button>
    <button on:click={() => goto('/')} class="bg-neutral-600 text-white px-2 py-1 rounded-[4px] m-1" style="display: inline-block;">Back</button>


  </form>
  
  <style>
    /* Add CSS styles for the form and its elements */
    h1.center {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center; /* Center the text horizontally */
  }
  
    form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
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
  
    input[type="text"],
    input[type="email"],
    input[type="number"],
    input[type="password"],
    input[type="repeatpassword"],

    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 16px;
    }
  
    /* Customize the appearance of the Age input */
    input[type="number"] {
      width: 50px; /* Adjust the width to make it smaller */
      padding: 8px;
      text-align: center; /* Center the text in the input */
      font-weight: bold; /* Make the text bold */
      font-size: 18px; /* Adjust the font size */
    }
  
    textarea {
      height: 100px;
    }
  
    button {
      background-color: rgb(92, 122, 154);
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 18px;
      cursor: pointer;
      align-self: flex-start; /* Align the button to the left */
    }
  
    button:hover {
      background-color: #5890df;
    }
  </style>
  