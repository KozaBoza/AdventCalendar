# CUTESOMEE ADVENT CALENDAR  ˖.𖥔 ݁ ˖ ⊹ ࣪ ˖ 

<br/>

**Create personalized, interactive digital advent calendars for your loved ones.**
*No tracking, no ads, just vibes.*

[**Live Demo**](https://twoja-strona.vercel.app) · [**Report Bug**](https://github.com/twoj-login/repo/issues) · [**Request Feature**](https://github.com/twoj-login/repo/issues)

---

## ABOOUT ⋆.˚𖦹⋆✮⋆.˚

This project allows users to create custom digital advent calendars. It's not just about opening doors; it's about crafting a unique experience. Each day can be customized using a drag-and-drop canvas editor where you can place text, stickers, images, and links.

The calendar respects the recipient's timezone, ensuring doors only open when the day actually arrives.

### FEATURES ͙͘͡★

* **Canvas Door Editor**: Full creative freedom! Drag, drop, resize, and rotate elements (text, stickers, treats, custom photos).
* **Mobile-First Design**: Optimized for mobile viewing with a built-in **iPhone Preview** mode in the editor.
* **Time-Lock Mechanism**: Doors are locked based on the specific date and the creator's chosen timezone.
* **Dynamic Themes**: Switch between *Classic*, *Elegant*, and *Gifts* themes instantly.
* **Secure Sharing**: View-only public links for recipients and token-protected edit links for creators.
* **Firebase Backend**: Real-time data saving and retrieval.

## BUILT WITH ᯓ★

* ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
* ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
* ![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
* ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

# GETTING STARTED ᯓ★

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/your_username/repo_name.git](https://github.com/your_username/repo_name.git)
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Setup Firebase**
    * Create a project at [Firebase Console](https://console.firebase.google.com/).
    * Create a Firestore Database.
    * Copy your web app config.
    * Create a `firebase.js` file in `src/` and paste your config:
    ```js
    // src/firebase.js
    import { initializeApp } from "firebase/app";
    import { getFirestore } from "firebase/firestore";

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "...",
      appId: "..."
    };

    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
    ```
4.  **Run the application**
    ```sh
    npm run dev
    ```

## Made with <3  by Natala Tomala
