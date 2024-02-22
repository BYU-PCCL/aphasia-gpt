<script lang="ts">
    import {goto} from '$app/navigation'
    import type { EditProfileDbData } from '@/lib/types/EditProfile';
    import { userName } from '@/stores/user';
    import { onMount } from 'svelte';
    
    export let data;
    let isLoadingInitialData = true;
    let editProfileData: EditProfileDbData = {
        uid: "",
        name: "",
        age: 0,
        about: ""
    };


    async function getDatabaseValues(uid: string) {
        const response = await fetch(`/api/firebase/editProfile?uid=${encodeURIComponent(uid)}`, {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            },
        });
        const responseData = await response.json();
        if (response.ok) {
            return responseData as EditProfileDbData;
        } else {
            throw new Error(responseData.error || "Unknown error");
        }
    }
    
    async function handleSubmit(event: Event) {
        event.preventDefault();
        await sendDataToBackend();
        await goto('/');
    }
    
    
    
    async function sendDataToBackend(){
    try{
    const response = await fetch("/api/firebase/editProfile", {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify(editProfileData),
    });
    
    console.log('Full response from server:', response);
    
    if(!response.ok){
    const errorData = await response.json();
    console.error('Error data from server:', errorData);
    throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    console.log('Response from backend:', data);
    userName.set(editProfileData.name);
    }catch (error){
    console.error('Error:', error);
    }
    }


    onMount(async () => {   
        if (!data.userFirebaseUid) {
            console.warn('User not logged in');
            goto('/');
        }
        editProfileData = await getDatabaseValues(data.userFirebaseUid);
        isLoadingInitialData = false;
    });
    
    </script>
    
    
    <body>
        {#if isLoadingInitialData}
        <p>Loading...</p>
        {:else}
        <form on:submit={handleSubmit}>
          <div class="whole-form">
            <div class="form-group">
              <label for="name">Name:</label>
              <input type="text" id="name" bind:value={editProfileData.name} />
            </div>
            <div class="form-group">
              <label for="age">Age:</label>
              <input type="number" id="age" bind:value={editProfileData.age} />
            </div>
            <div class="form-group">
              <label for="about">Tell Us About Yourself!</label>
              <textarea id="about" bind:value={editProfileData.about} rows="4"></textarea>
            </div>
            <div class="button-container">
              <button type="submit" class="button">Submit</button>
              <button type="button" class="button back-button" on:click={() => goto('/')}>Back</button>
            </div>
          </div>
        </form>
        {/if}
      </body>
      




    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        /* Add CSS styles for the form and its elements */
        body {
            text-align: center;
            margin:20px;
        }
            
        form {
            max-width: 80%;
            max-height: 80%;
            padding: 20px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 5px;
            display: inline-block;
       
            flex-direction: column;
    
        }
        .form-group {
            display:flex;
            flex-direction: column; 
            margin-bottom: 30px; 
        }
        label {
            font-weight: bold;
            text-align: left;
            margin-bottom: 5px;
        }
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
        }
 
        input[type="number"] {
            width: 50px; 
            padding: 8px;
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
            font-size: 18px; 
        }
        input[type="text"] {
            width: 300px; 
            padding: 8px;
            text-align:left; 
            font-size: 18px; 
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
        }
        textarea {
            height: 300px;
        }
        .button-container {
            display: flex;
            justify-content: space-between; /* Align buttons parallelly */
            margin-top: 20px; /* Add space between the buttons and the form */
        }
        .button {
            flex: 1; 
            background-color: rgb(92, 122, 154);
            color: #fff;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
        }
        .button:hover {
            background-color: #5890df;
        }
    
        .back-button {
            margin-left: 10px;
        }

    </style>
    