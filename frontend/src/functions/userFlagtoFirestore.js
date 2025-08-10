import { doc, setDoc } from "firebase/firestore";
import { firestoreDB } from "../firebase/firebaseConfig";

export const userFlagtoFirestore = async (email, role) => {
    try {
        await setDoc(doc(firestoreDB, "usersCollection", email), {
            email: email,
            isDefaultPassword: true,
            role: role,
        });
        console.log("User flag saved successfully.");
    } catch (error) {
        console.error("Error saving user flag:", error);
    }
};