<script lang="ts">
    import {goto} from '$app/navigation'
    import { json } from "@sveltejs/kit";
    import { username } from "@/stores/user";
    export{signinusername}
    
    let signinusername = '';
    let email = '';
    let password = '';
    let repeatPassword = '';
    let name = '';
    let age = '';
    let about = '';
    let passwordMatch = true;
    let errorMessage = '';
    
    
    function checkpassword(password, repeatPassword) {
    passwordMatch = password === repeatPassword;
    errorMessage = passwordMatch ? '' : 'Passwords do not match';
    }
    
    
    
    function handleSubmit() {
    checkpassword(password, repeatPassword);
    if (!passwordMatch) {
    // Display an error message or handle the validation as needed
    console.error(errorMessage);
    return;
    }
    sendDataToBackend(signinusername, email, password, name, age, about)
    $username = signinusername
    }
    
    
    async function sendDataToBackend(signinusername, email, password, name, age, about){
    try{
    const response = await fetch("/api/firebase", {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({signinusername, email, password, name, age, about}),
    });
    
    console.log('Full response from server:', response);
    
    if(!response.ok){
    const errorData = await response.json();
    console.error('Error data from server:', errorData);
    throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    console.log('Response from backend:', data);
    }catch (error){
    console.error('Error:', error);
    }
    }
    </script>
    
    
    <form on:submit={handleSubmit}>
    <div class="form-group">
    <label for="username">Username:</label>
    <input type="username" id="username" placeholder="Do Not include any special character" bind:value={signinusername} required />
    </div>
    
    <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" placeholder="Grand@email.com" bind:value={email} required />
    </div>
    
    <div class="form-group">
    <label for="password">Password: </label>
    <input
    type="password"
    id="password"
    placeholder="Password"
    bind:value={password}
    required
    on:input={() => checkpassword(password, repeatPassword)}
    />
    </div>
    
    <div class="form-group">
    <label for="repeatpassword">Repeat password: </label>
    <input
    type="password"
    id="repeatpassword"
    placeholder="Confirm Password"
    bind:value={repeatPassword}
    required
    on:input={() => checkpassword(password, repeatPassword)}
    />
    {#if !passwordMatch}
    <p class="error-message">{errorMessage}</p>
    {/if}
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
    <button on:click={handleSubmit} on:click={() => goto('/')} type="button" style="display: inline-block;" >Submit</button>
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
    
    input[type="username"],
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