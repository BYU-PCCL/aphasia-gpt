

<script lang="ts">
    import {goto} from '$app/navigation'
    import { json } from "@sveltejs/kit";
    import { username} from "@/stores/user";

    let name = '';
    let age = '';
    let about = '';
    let editUsername = '';
    if ($username !== null) {
        editUsername = $username;
    } else {
        editUsername = '';
    }
  
    
    
    function handleSubmit() {

        console.log(name);
        console.log(age);
        console.log(about);
        sendDataToBackend(editUsername, name, age, about);
}
    
    
    
    async function sendDataToBackend(username:string, name:string, age:string, about:string){
    try{
    const response = await fetch("/api/firebase/editProfile", {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({username,name, age, about}),
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
    
    
    <body>
        <form on:submit={handleSubmit}>
          <div class="whole-form">
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
            <div class="button-container">
              <button type="submit" on:click={() => goto('/')}  class="button">Submit</button>
              <button on:click={() => goto('/')} class="button back-button">Back</button>
            </div>
          </div>
        </form>
      </body>
      




    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        /* Add CSS styles for the form and its elements */
        body {
            text-align: center;
            margin:20px;
        }
      
        h1.center {
            font-size: 24px;
            margin-bottom: 25px;
            text-align: center; /* Center the text horizontally */
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
    