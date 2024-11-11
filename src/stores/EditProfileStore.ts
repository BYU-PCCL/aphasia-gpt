import { get, writable } from "svelte/store";
import { userFirebaseUid } from "./user";
import type {EditProfileDbData, ProfileState} from "@/lib/types/EditProfile";

type ProfileStore={
   Profile : ProfileState;
}

function createProfileStore() {
    const {subscribe, update} = writable<ProfileStore>(getBaseStore());
    // getDBProfileData();
    // subscribe(() => {
    //     const userUid: string | null = get(userFirebaseUid);
    //     if (!userUid) return; // Don't update the database if the user is not logged in
    // });
    userFirebaseUid.subscribe(async (userUid: string | null) => {
      // console.log("Current user UID:", userUid);
      if(!userUid){
        // console.log("user did not log in 1");
        return;
      }
      // console.log("User is logged in, fetching profile data...");
      const initialDatabaseValues: EditProfileDbData = await getDatabaseValues(userUid);
      setStoreFromDatabaseValues(initialDatabaseValues);
    });

    function setStoreFromDatabaseValues(dbData: EditProfileDbData) {
        update((store) => {
          store.Profile.name = dbData.name;
          store.Profile.age = dbData.age;
          store.Profile.about = dbData.about;
          return store;
        });
      }

      
    //   async function getDBProfileData(){
    //     const userUid: string | null = get(userFirebaseUid);
    //     if (!userUid) {
    //         console.log("user did not log in");
            
    //       // Don't fetch from the DB if the user is not logged in
    //       return;
    //     }
    //     console.log("calling createProfileStore()");
    //     const initialDatabaseValues: EditProfileDbData = await getDatabaseValues(userUid);
    //     setStoreFromDatabaseValues(initialDatabaseValues);
    //   }
      
  
      return {
        subscribe, 
        initialize: async () => {
            const userUid: string | null = get(userFirebaseUid);
            if (!userUid) {
                // console.log("user did not log in");
                
              // Don't fetch from the DB if the user is not logged in
              return;
            }
            
           
            const initialDatabaseValues: EditProfileDbData = await getDatabaseValues(userUid);
            setStoreFromDatabaseValues(initialDatabaseValues);
          }
        }
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
        // console.log(responseData.name);
        // console.log(responseData.age);
        // console.log("Profile data from firebase",responseData.about);
      return responseData as EditProfileDbData;
    } else {
      throw new Error(responseData.error || "Unknown error");
    }
  }

function getBaseStore(): ProfileStore {
    return {
       Profile:{
        name:"",
        age:NaN,
        about:"",
       }
    };
  }
export const ProfileStore = createProfileStore();