<script lang="ts">
    import { goto } from '$app/navigation';
    import type { EditProfileDbData } from '@/lib/types/EditProfile';
    import { userName } from '@/stores/user';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { userFirebaseUid } from '@/stores/user';


    export let toggleEditProfile: () => void; // Declare the prop for toggling the form
    let uid = get(userFirebaseUid);
    
    let isLoadingInitialData = true;
    let editProfileData: EditProfileDbData = {
        uid: "",
        name: "",
        age: 0,
        about: ""
    };
    
    // Clear profile data when the user logs out or a new session begins
    // $: if (!data || data.userFirebaseUid !== editProfileData.uid) {
    //     editProfileData = { uid: "", name: "", age: 0, about: "" };
    // }


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
        toggleEditProfile(); // Close the popup on submit
        await goto('/');
    }
    
    async function sendDataToBackend(){
        try {
            const response = await fetch("/api/firebase/editProfile", {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(editProfileData),
            });

            
            if(!response.ok){
                const errorData = await response.json();
                console.error('Error data from server:', errorData);
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            userName.set(editProfileData.name);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    onMount(async () => {   
        
        if(uid) {
            editProfileData = await getDatabaseValues(uid);
        }
        else {
            console.error('UID is null, unable to fetch profile data');
        }
        
        isLoadingInitialData = false;
    });
</script>

<div class="modal-overlay" on:click={toggleEditProfile}> <!-- Overlay to act as the background -->
    <div class="modal-content" on:click|stopPropagation> <!-- Click stopPropagation to avoid closing when clicking inside the form -->
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
                <button type="submit" class="button bg-sky-100 text-sky-500">Submit</button>
                <button type="button" class="button back-button" on:click={toggleEditProfile}>Close</button>
              </div>
            </div>
          </form>          
        {/if}
    </div>
</div>

<style>
    /* Styles for the modal overlay and content */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Make sure it stays above everything else */
    }

    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 500px;
        position: relative;
        color: black; /* Ensure all text inside the modal is black */
    }

    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
    }

    label {
        font-weight: bold;
        margin-bottom: 5px;
    }

    textarea, input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 16px;
        color: black; /* Ensure input and textarea text is black */
    }

    .button-container {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    }

    .button {
        background-color: rgb(187, 235, 255); 
        color: black; /* Ensure button text is black */
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        font-size: 18px;
        cursor: pointer;
    }

    .button:hover {
        background-color: rgb(56, 189, 248); /* Darken on hover */
    }

    .back-button {
        background-color: rgb(209, 213, 219); /* Light gray background for the close button */
        color: black; /* Ensure close button text is black */
    }

    .back-button:hover {
        background-color: rgb(156, 163, 175); /* Darken gray on hover */
    }
</style>
